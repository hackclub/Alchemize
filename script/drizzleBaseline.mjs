// First half of `npm run db:migrate`, run before `drizzle-kit migrate`.
//
// Databases created before migrations moved to drizzle-kit (production included) were built with `drizzle-kit push`
// plus the hand-written SQL in script/migrations/. drizzle/0000_baseline.sql is that schema as it stood before
// Telescreen, so on such a database it must be recorded as applied rather than run (its CREATE TABLEs would fail).
//
// - Fresh database (no users table): does nothing; drizzle-kit migrate then creates everything from 0000.
// - Database already tracked by drizzle-kit: does nothing.
// - Existing, untracked database: checks that every table and column of the baseline exists (so the old hand-written
//   migrations have all run), then records 0000 as applied exactly as drizzle-kit would have. Refuses otherwise.
//
// Plain JS on purpose (no tsx needed) and connects with DATABASE_URL as given, like drizzle.config.ts.
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import dotenv from "dotenv"
import pg from "pg"

dotenv.config({ path: [".env.local", ".env"], quiet: true })

// Must match drizzle.config.ts
const MIGRATIONS_FOLDER = "drizzle"
const MIGRATIONS_SCHEMA = "drizzle"
const MIGRATIONS_TABLE = "__drizzle_migrations"
const BASELINE_TAG = "0000_baseline"

const fail = message => {
	console.error(`\n${message}\n`)
	process.exit(1)
}

if (!process.env.DATABASE_URL) fail("DATABASE_URL is not set")

const journal = JSON.parse(readFileSync(`${MIGRATIONS_FOLDER}/meta/_journal.json`, "utf8"))
const baseline = journal.entries[0]
if (baseline?.tag !== BASELINE_TAG) fail(`The first migration in ${MIGRATIONS_FOLDER}/meta/_journal.json must be ${BASELINE_TAG}`)
const baselineSql = readFileSync(`${MIGRATIONS_FOLDER}/${BASELINE_TAG}.sql`).toString()
const snapshot = JSON.parse(readFileSync(`${MIGRATIONS_FOLDER}/meta/0000_snapshot.json`, "utf8"))

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect().catch(error => fail(`Couldn't connect to the database: ${error.message}`))
try {
	const tracked = await client.query(`SELECT to_regclass('${MIGRATIONS_SCHEMA}."${MIGRATIONS_TABLE}"') AS t`)
	if (tracked.rows[0].t) {
		const { rows } = await client.query(`SELECT count(*)::int AS n FROM ${MIGRATIONS_SCHEMA}."${MIGRATIONS_TABLE}"`)
		if (rows[0].n > 0) process.exit(0)
	}
	const existing = await client.query(`SELECT to_regclass('public.users') AS t`)
	if (!existing.rows[0].t) {
		console.log("Empty database: drizzle-kit will create the whole schema")
		process.exit(0)
	}

	// Every table and column the baseline declares must already exist, otherwise recording it would hide a gap
	const { rows: columns } = await client.query(
		"SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'"
	)
	const present = new Set(columns.map(c => `${c.table_name}.${c.column_name}`))
	const missing = []
	for (const table of Object.values(snapshot.tables)) {
		for (const column of Object.keys(table.columns)) {
			if (!present.has(`${table.name}.${column}`)) missing.push(`${table.name}.${column}`)
		}
	}
	if (missing.length > 0) {
		fail(
			`This database predates drizzle migrations but doesn't match ${BASELINE_TAG}. Missing:\n  ${missing.join("\n  ")}\n\n` +
			"Run the hand-written migration that adds them first (script/migrations/), then run this again."
		)
	}

	await client.query("BEGIN")
	await client.query(`CREATE SCHEMA IF NOT EXISTS ${MIGRATIONS_SCHEMA}`)
	// Same table drizzle-kit creates (drizzle-orm pg-core dialect.migrate)
	await client.query(`CREATE TABLE IF NOT EXISTS ${MIGRATIONS_SCHEMA}."${MIGRATIONS_TABLE}" (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)`)
	await client.query(`LOCK TABLE ${MIGRATIONS_SCHEMA}."${MIGRATIONS_TABLE}" IN EXCLUSIVE MODE`)
	const { rows } = await client.query(`SELECT count(*)::int AS n FROM ${MIGRATIONS_SCHEMA}."${MIGRATIONS_TABLE}"`)
	if (rows[0].n === 0) {
		await client.query(
			`INSERT INTO ${MIGRATIONS_SCHEMA}."${MIGRATIONS_TABLE}" (hash, created_at) VALUES ($1, $2)`,
			[createHash("sha256").update(baselineSql).digest("hex"), baseline.when]
		)
		console.log(`Existing database: recorded ${BASELINE_TAG} as already applied`)
	}
	await client.query("COMMIT")
} catch (error) {
	await client.query("ROLLBACK").catch(() => {})
	fail(`Baseline check failed: ${error.message}`)
} finally {
	await client.end()
}
