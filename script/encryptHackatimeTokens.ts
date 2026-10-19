// Re-encrypts Hackatime OAuth tokens that users.hackatime still holds in plaintext, from before tokens were
// encrypted at rest (src/lib/server/hackatimeToken.ts). Run AFTER deploying that code: it reads both forms, so the
// app keeps working before, during and after this script. Needs DATABASE_URL and the app's PII_ENCRYPTION_KEY
// (from .env.local / .env or the environment). Safe to re-run: rows already encrypted are left alone.
//
//   npx tsx script/encryptHackatimeTokens.ts            dry run: prints the counts, writes nothing
//   npx tsx script/encryptHackatimeTokens.ts --apply    re-encrypts every plaintext token in one transaction
//
// Only the rows being re-encrypted are locked (FOR UPDATE), so logins and balance updates are not blocked while it
// runs. A user who connects Hackatime at the same time writes an encrypted token through the app and is skipped or
// overwritten with their own newer token, never with a stale one. Token values are never printed.
import dotenv from "dotenv"
import { Pool } from "pg"
import { decryptHackatimeToken, encryptHackatimeToken, isEncryptedHackatimeToken } from "../src/lib/server/hackatimeToken"
dotenv.config({ path: [".env.local", ".env"] })

// users.hackatime is varchar(1000); an encrypted token is 2 x the token length + 58 characters
const COLUMN_LIMIT = 1000

const apply = process.argv.slice(2).includes("--apply")

// Same DATABASE_SSL handling as src/lib/db.ts
const resolveSsl = (url: string) => {
    const mode = (process.env.DATABASE_SSL ?? "").trim().toLowerCase()
    if (mode === "verify") return { rejectUnauthorized: true }
    if (mode === "require") return { rejectUnauthorized: false }
    if (mode === "disable") return false
    return url.includes("neon.tech") ? { rejectUnauthorized: true } : false
}

const main = async () => {
    const { DATABASE_URL } = process.env
    if (!DATABASE_URL) throw new Error("DATABASE_URL is not set")
    // Fails fast on a missing or malformed PII_ENCRYPTION_KEY, before touching the database
    decryptHackatimeToken(encryptHackatimeToken("probe"))

    const pool = new Pool({ connectionString: DATABASE_URL, ssl: resolveSsl(DATABASE_URL) })
    const client = await pool.connect()
    try {
        await client.query("BEGIN")
        const total = await client.query("SELECT count(*)::int AS c FROM users")
        const rows = await client.query<{ id: number, hackatime: string }>(
            "SELECT id, hackatime FROM users WHERE coalesce(hackatime, '') <> '' ORDER BY id FOR UPDATE"
        )
        const connected = rows.rows
        const alreadyEncrypted = connected.filter(row => isEncryptedHackatimeToken(row.hackatime))
        const legacy = connected.filter(row => !isEncryptedHackatimeToken(row.hackatime))

        const problems: string[] = []
        const plan = legacy.map(row => {
            const encrypted = encryptHackatimeToken(row.hackatime)
            if (encrypted.length > COLUMN_LIMIT) problems.push(`user id ${row.id}: encrypted token would be ${encrypted.length} characters, over the column limit of ${COLUMN_LIMIT}`)
            return { id: row.id, plaintext: row.hackatime, encrypted }
        })

        console.log(`Users: ${total.rows[0].c}`)
        console.log(`  not connected to Hackatime: ${total.rows[0].c - connected.length}`)
        console.log(`  already encrypted:          ${alreadyEncrypted.length}`)
        console.log(`  plaintext, to re-encrypt:   ${legacy.length}`)

        if (problems.length > 0) {
            console.error(`\nABORTING, ${problems.length} problem(s), nothing was written:`)
            for (const p of problems) console.error(`  - ${p}`)
            await client.query("ROLLBACK")
            process.exitCode = 1
            return
        }
        if (!apply) {
            await client.query("ROLLBACK")
            console.log(legacy.length === 0
                ? "\nNothing to do."
                : "\nDry run only, nothing was written. Re-run with --apply to re-encrypt.")
            return
        }
        if (plan.length === 0) {
            await client.query("ROLLBACK")
            console.log("\nNothing to do.")
            return
        }

        await client.query(
            "UPDATE users AS u SET hackatime = v.t FROM unnest($1::int[], $2::text[]) AS v(id, t) WHERE u.id = v.id",
            [plan.map(row => row.id), plan.map(row => row.encrypted)]
        )

        // Verify before committing: every row must now be encrypted and decrypt back to the token it had
        const after = await client.query<{ id: number, hackatime: string }>(
            "SELECT id, hackatime FROM users WHERE coalesce(hackatime, '') <> ''"
        )
        const stillPlaintext = after.rows.filter(row => !isEncryptedHackatimeToken(row.hackatime))
        if (stillPlaintext.length > 0) {
            throw new Error(`${stillPlaintext.length} token(s) still in plaintext after the update (user ids ${stillPlaintext.map(row => row.id).join(", ")})`)
        }
        const byId = new Map(after.rows.map(row => [row.id, row.hackatime]))
        for (const row of plan) {
            if (decryptHackatimeToken(byId.get(row.id) ?? "") !== row.plaintext) {
                throw new Error(`user id ${row.id}: stored token does not decrypt back to the original`)
            }
        }
        await client.query("COMMIT")
        console.log(`\nRe-encrypted ${plan.length} token(s). Verified: all ${after.rows.length} stored tokens are encrypted.`)
    } catch (error) {
        await client.query("ROLLBACK")
        console.error("Failed and rolled back:", error)
        process.exitCode = 1
    } finally {
        client.release()
        await pool.end()
    }
}

main()
