// Step 2 of the single-currency (Aqua Regia) migration. Run AFTER script/migrations/2026-10-aqua-regia-columns.sql,
// with the app stopped (or in maintenance) so nothing writes balances while this runs.
//
//   npx tsx script/migrateToAquaRegia.ts                        dry run: prints the summary, writes nothing
//   npx tsx script/migrateToAquaRegia.ts --report=report.csv    dry run + per-user CSV (keyed by user id, no emails)
//   npx tsx script/migrateToAquaRegia.ts --apply                performs the migration in one transaction
//
// Conversion into hundredths of Aqua Regia ($5/unit), rounded UP per user so nobody loses value:
//   redstone ($4) x80, glowstone ($4.5) x90, aqua_regia ($5) x100, potion_mix (~$1) x20
// Shop prices use the same factors (always exact for whole-number prices).
// It aborts without writing anything on: unknown currency keys, negative/non-numeric balances, a non-zero new balance
// (migration already ran, or new code already wrote), ambiguous item prices, or a previous migration ledger entry.
import dotenv from "dotenv"
import loosejson from "loose-json"
import { writeFileSync } from "fs"
import { Pool } from "pg"
dotenv.config()

const FACTORS = { redstone: 80, glowstone: 90, aqua_regia: 100, potion_mix: 20 } as const
const DOLLARS_PER_UNIT = { redstone: 4, glowstone: 4.5, aqua_regia: 5, potion_mix: 1 } as const
type LegacyKey = keyof typeof FACTORS
const LEGACY_KEYS = Object.keys(FACTORS) as LegacyKey[]
const MIGRATION_REASON = "currency-migration"
const BACKUP_SUFFIX = "20261001"
const MAX_HUNDREDTHS = 2_147_483_647

const args = process.argv.slice(2)
const apply = args.includes("--apply")
const reportPath = args.find(a => a.startsWith("--report="))?.slice("--report=".length)

const parseLegacy = (raw: unknown, where: string, problems: string[]): Record<LegacyKey, number> => {
    const out = { redstone: 0, glowstone: 0, aqua_regia: 0, potion_mix: 0 }
    let parsed: any
    try {
        parsed = typeof raw === "string" ? (raw.trim() === "" ? {} : loosejson(raw)) : (raw ?? {})
    } catch {
        problems.push(`${where}: unparseable value`)
        return out
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        problems.push(`${where}: not an object`)
        return out
    }
    for (const [key, value] of Object.entries(parsed)) {
        if (!LEGACY_KEYS.includes(key as LegacyKey)) {
            problems.push(`${where}: unknown currency key "${key}"`)
            continue
        }
        const n = value === null || value === undefined ? 0 : Number(value)
        if (!Number.isFinite(n) || n < 0) {
            problems.push(`${where}: invalid ${key} value ${JSON.stringify(value)}`)
            continue
        }
        out[key as LegacyKey] = n
    }
    return out
}

// Sum in hundredths; the 1e-9 guard stops float noise (e.g. 12.500000001) from rounding a whole value up
const toHundredths = (legacy: Record<LegacyKey, number>) =>
    Math.ceil(LEGACY_KEYS.reduce((sum, k) => sum + legacy[k] * FACTORS[k], 0) - 1e-9)
const toDollars = (legacy: Record<LegacyKey, number>) =>
    LEGACY_KEYS.reduce((sum, k) => sum + legacy[k] * DOLLARS_PER_UNIT[k], 0)

const main = async () => {
    const { DATABASE_URL } = process.env
    if (!DATABASE_URL) throw new Error("DATABASE_URL is not set")
    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: DATABASE_URL.includes("neon.tech") ? { rejectUnauthorized: false } : false,
    })
    const client = await pool.connect()
    try {
        await client.query("BEGIN")
        // Block concurrent writes to balances, prices and the ledger for the duration of the migration
        await client.query("LOCK TABLE users, shop_items, ledger IN EXCLUSIVE MODE")

        const problems: string[] = []
        const previous = await client.query("SELECT count(*)::int AS c FROM ledger WHERE reason = $1", [MIGRATION_REASON])
        if (previous.rows[0].c > 0) problems.push(`ledger already has ${previous.rows[0].c} "${MIGRATION_REASON}" entries`)

        // ---- users ----
        const users = await client.query('SELECT id, email, "slackId", currency, "balanceHundredths" FROM users ORDER BY id')
        const userPlan = users.rows.map(row => {
            const legacy = parseLegacy(row.currency, `user id ${row.id}`, problems)
            const newHundredths = toHundredths(legacy)
            if (row.balanceHundredths !== 0) problems.push(`user id ${row.id}: balanceHundredths is already ${row.balanceHundredths}`)
            if (newHundredths > MAX_HUNDREDTHS) problems.push(`user id ${row.id}: converted balance overflows`)
            return { id: row.id as number, email: row.email as string, slackId: (row.slackId ?? "") as string, legacy, newHundredths }
        })
        const dollarsBefore = userPlan.reduce((s, u) => s + toDollars(u.legacy), 0)
        const totalHundredths = userPlan.reduce((s, u) => s + u.newHundredths, 0)
        const dollarsAfter = (totalHundredths / 100) * 5

        // ---- shop items ----
        const items = await client.query('SELECT "itemID", name, "itemPrice", "priceHundredths", priority FROM shop_items ORDER BY priority, name')
        const itemPlan = items.rows.map(row => {
            const where = `item "${row.name}" (${row.itemID})`
            const legacy = parseLegacy(row.itemPrice, where, problems)
            const nonZero = LEGACY_KEYS.filter(k => legacy[k] > 0)
            if (nonZero.length > 1) problems.push(`${where}: priced in more than one currency (${nonZero.join(", ")})`)
            const exact = LEGACY_KEYS.reduce((sum, k) => sum + legacy[k] * FACTORS[k], 0)
            const priceHundredths = Math.round(exact)
            if (Math.abs(exact - priceHundredths) > 1e-6) problems.push(`${where}: price does not convert to a whole hundredth (${exact})`)
            if (row.priceHundredths !== 0 && row.priceHundredths !== priceHundredths) problems.push(`${where}: priceHundredths is already ${row.priceHundredths}`)
            return { itemID: row.itemID as string, name: row.name as string, priority: row.priority as number, from: nonZero[0] ?? "none", legacyPrice: nonZero[0] ? legacy[nonZero[0]] : 0, priceHundredths }
        })

        // ---- report ----
        console.log(`Users: ${userPlan.length} (${userPlan.filter(u => u.newHundredths > 0).length} with a non-zero balance)`)
        for (const k of LEGACY_KEYS) console.log(`  legacy ${k.padEnd(10)} total: ${userPlan.reduce((s, u) => s + u.legacy[k], 0)}`)
        console.log(`  new Aqua Regia total: ${(totalHundredths / 100).toFixed(2)} (${totalHundredths} hundredths)`)
        console.log(`  value before: $${dollarsBefore.toFixed(2)}  after: $${dollarsAfter.toFixed(2)}  rounding given away: $${(dollarsAfter - dollarsBefore).toFixed(2)}`)
        console.log(`Shop items: ${itemPlan.length}`)
        for (const i of itemPlan) {
            const flag = i.priceHundredths === 0 && i.priority >= 0 ? "  <-- visible but unpriced, will not be purchasable" : ""
            console.log(`  ${i.name}: ${i.legacyPrice} ${i.from} -> ${(i.priceHundredths / 100).toFixed(2)} Aqua Regia${flag}`)
        }
        if (reportPath) {
            const header = "userId,redstone,glowstone,aqua_regia,potion_mix,dollarsBefore,newAquaRegia,dollarsAfter"
            const lines = userPlan.map(u => [u.id, ...LEGACY_KEYS.map(k => u.legacy[k]), toDollars(u.legacy).toFixed(2), (u.newHundredths / 100).toFixed(2), ((u.newHundredths / 100) * 5).toFixed(2)].join(","))
            writeFileSync(reportPath, [header, ...lines].join("\n") + "\n")
            console.log(`Per-user report written to ${reportPath}`)
        }
        if (dollarsAfter + 1e-6 < dollarsBefore) problems.push("converted total is worth less than the legacy total")

        if (problems.length > 0) {
            console.error(`\nABORTING, ${problems.length} problem(s), nothing was written:`)
            for (const p of problems) console.error(`  - ${p}`)
            await client.query("ROLLBACK")
            process.exitCode = 1
            return
        }
        if (!apply) {
            await client.query("ROLLBACK")
            console.log("\nDry run only, nothing was written. Re-run with --apply to migrate.")
            return
        }

        // ---- apply ----
        // Snapshots for verification/rollback; CREATE TABLE fails if they already exist, which also blocks a re-run
        await client.query(`CREATE TABLE users_currency_backup_${BACKUP_SUFFIX} AS SELECT id, email, "slackId", currency, "balanceHundredths" FROM users`)
        await client.query(`CREATE TABLE shop_items_price_backup_${BACKUP_SUFFIX} AS SELECT "itemID", name, "itemPrice", "priceHundredths" FROM shop_items`)

        await client.query(
            'UPDATE users AS u SET "balanceHundredths" = v.h FROM unnest($1::int[], $2::int[]) AS v(id, h) WHERE u.id = v.id',
            [userPlan.map(u => u.id), userPlan.map(u => u.newHundredths)]
        )
        const credited = userPlan.filter(u => u.newHundredths > 0)
        await client.query(
            `INSERT INTO ledger (email, "slackId", sign, amount, "amountHundredths", "currencyType", reason, remarks)
             SELECT v.email, v.slack, true, v.h / 100.0, v.h, 'aqua_regia', $5, v.remarks
             FROM unnest($1::text[], $2::text[], $3::int[], $4::text[]) AS v(email, slack, h, remarks)`,
            [
                credited.map(u => u.email),
                credited.map(u => u.slackId),
                credited.map(u => u.newHundredths),
                credited.map(u => `Converted legacy balances (${LEGACY_KEYS.map(k => `${k}=${u.legacy[k]}`).join(", ")}) to ${(u.newHundredths / 100).toFixed(2)} Aqua Regia`),
                MIGRATION_REASON,
            ]
        )
        await client.query(
            'UPDATE shop_items AS s SET "priceHundredths" = v.p FROM unnest($1::uuid[], $2::int[]) AS v(id, p) WHERE s."itemID" = v.id',
            [itemPlan.map(i => i.itemID), itemPlan.map(i => i.priceHundredths)]
        )

        // Verify before committing: balances and migration ledger credits must both equal the planned total
        const check = await client.query(
            `SELECT (SELECT coalesce(sum("balanceHundredths"), 0)::bigint FROM users) AS balances,
                    (SELECT coalesce(sum("amountHundredths"), 0)::bigint FROM ledger WHERE reason = $1) AS ledger`,
            [MIGRATION_REASON]
        )
        const { balances, ledger } = check.rows[0]
        if (Number(balances) !== totalHundredths || Number(ledger) !== totalHundredths) {
            throw new Error(`Verification failed: planned ${totalHundredths}, balances ${balances}, ledger ${ledger}`)
        }
        await client.query("COMMIT")
        console.log(`\nMigrated ${userPlan.length} users and ${itemPlan.length} items. Verified total: ${totalHundredths} hundredths.`)
        console.log(`Backups: users_currency_backup_${BACKUP_SUFFIX}, shop_items_price_backup_${BACKUP_SUFFIX}`)
    } catch (error) {
        await client.query("ROLLBACK")
        console.error("Migration failed and was rolled back:", error)
        process.exitCode = 1
    } finally {
        client.release()
        await pool.end()
    }
}

main()
