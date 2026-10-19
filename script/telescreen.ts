// Telescreen (Robert) setup and maintenance. Needs DATABASE_URL and ROBERT_API_KEY (from .env.local / .env), and
// script/migrations/2026-10-telescreen.sql already applied.
//
//   npx tsx script/telescreen.ts set-webhook https://alchemize.hackclub.com/api/telescreen/webhook
//       Points Robert's outcome webhook at Alchemize. Prints the signing secret when Robert issues one (first URL,
//       or a new host): it is shown once, store it as ROBERT_WEBHOOK_SECRET. Then press "Send test" in Robert's
//       event settings and check the server log for "ping received".
//   npx tsx script/telescreen.ts backfill [--apply]
//       Sends every project waiting on T2 (T1-approved time not yet paid) that has no up-to-date submission.
//       Dry run unless --apply.
//   npx tsx script/telescreen.ts sync [--apply]
//       Retries failed sends, and Robert updates that failed when a project was rejected or superseded here.
//       Dry run unless --apply.
import { getOpenTelescreenSubmission, getShippedProjectLogs, getTelescreenSubmissionsInStates, pool } from "../src/lib/db"
import { ensureTelescreenSubmission, isUpToDate, retryRobertRelease, telescreenConfig } from "../src/lib/server/telescreen"
import { hasUnpushedApprovedEntries } from "../src/lib/server/projectLog"
import { setWebhookUrl } from "../src/lib/server/telescreenClient"
import type { Log } from "../src/lib/types"

const USAGE = "Usage: npx tsx script/telescreen.ts set-webhook <url> | backfill [--apply] | sync [--apply]"

const [command, ...rest] = process.argv.slice(2)
const apply = rest.includes("--apply")
const ACTOR = "Alchemize backfill"

// A mistyped flag (e.g. --aply) must not silently turn an apply into a dry run
const unexpectedArguments = (): string[] => {
	if (command === "set-webhook") return rest.slice(1)
	if (command === "backfill" || command === "sync") return rest.filter(arg => arg !== "--apply")
	return []
}

const parseLog = (raw: string): Log[] => {
	try { return JSON.parse(raw || "[]") } catch { return [] }
}

const setWebhook = async (url: string | undefined) => {
	const config = telescreenConfig()
	if (!config) throw new Error("ROBERT_API_KEY is missing or doesn't start with ysws_")
	if (!url || !url.startsWith("https://")) throw new Error("Pass the public https URL of /api/telescreen/webhook")
	const result = await setWebhookUrl(config, url)
	if (!result.ok) throw new Error(`Robert refused the webhook URL: ${result.message}`)
	console.log(`Webhook URL set to ${result.data.webhookUrl}`)
	if (result.data.secret) {
		console.log(`\nSigning secret (shown once, store it as ROBERT_WEBHOOK_SECRET):\n${result.data.secret}\n`)
	} else {
		console.log("Same host as before, so the existing signing secret still applies")
	}
}

const backfill = async () => {
	const projects = await getShippedProjectLogs()
	let waiting = 0, sent = 0, failed = 0
	for (const project of projects) {
		const log = parseLog(project.log)
		if (!hasUnpushedApprovedEntries(log)) continue
		const open = await getOpenTelescreenSubmission(project.id)
		if (open?.robertProjectId && isUpToDate(open, log)) continue
		waiting++
		if (!apply) {
			console.log(`would send project ${project.id} (${project.Name})${open ? ` [open submission: ${open.state}]` : ""}`)
			continue
		}
		const result = await ensureTelescreenSubmission(project.id, ACTOR)
		if (result.ok) {
			sent++
			console.log(`sent project ${project.id} (${project.Name}): ${result.submission.state}`)
		} else {
			failed++
			console.log(`FAILED project ${project.id} (${project.Name}): ${result.message}`)
		}
	}
	console.log(`\n${waiting} project(s) waiting on T2 without an up-to-date Telescreen submission${apply ? `: ${sent} sent, ${failed} failed` : " (dry run, pass --apply to send)"}`)
}

const sync = async () => {
	const unsent = await getTelescreenSubmissionsInStates(["unsent"], true)
	for (const row of unsent) {
		if (!apply) { console.log(`would retry sending project ${row.projectId} (last error: ${row.lastError ?? "none"})`); continue }
		const result = await ensureTelescreenSubmission(row.projectId, ACTOR)
		console.log(`project ${row.projectId}: ${result.ok ? `sent (${result.submission.state})` : `FAILED: ${result.message}`}`)
	}
	// Closed here while Robert still has them open. Paid ones are left alone: approving them in Robert after the
	// fact would claim a fraud review that never happened (super admin override)
	const stranded = (await getTelescreenSubmissionsInStates(["awaiting_review", "awaiting_outcome"], false))
		.filter(row => row.robertProjectId && row.closeReason !== "awarded")
	for (const row of stranded) {
		if (!apply) { console.log(`would close project ${row.projectId} in Telescreen (${row.state}, closed here: ${row.closeReason})`); continue }
		const error = await retryRobertRelease(row)
		console.log(`project ${row.projectId}: ${error ? `FAILED: ${error}` : "closed in Telescreen"}`)
	}
	console.log(`\n${unsent.length} unsent, ${stranded.length} to close in Telescreen${apply ? "" : " (dry run, pass --apply)"}`)
}

try {
	const unexpected = unexpectedArguments()
	if (unexpected.length > 0) {
		console.error(`Unexpected argument${unexpected.length > 1 ? "s" : ""}: ${unexpected.join(" ")}\n${USAGE}`)
		process.exitCode = 1
	}
	else if (command === "set-webhook") await setWebhook(rest[0])
	else if (command === "backfill") await backfill()
	else if (command === "sync") await sync()
	else {
		console.log(USAGE)
		process.exitCode = 1
	}
} catch (error) {
	console.error((error as Error).message)
	process.exitCode = 1
} finally {
	await pool.end()
}
