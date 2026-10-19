// Tests for the Telescreen (Robert) client: webhook signatures, the submission payload, and the ship-time check
// that decides whether a review is out of date. No network or database.
// Run: npx tsx testing/manualTests/test-telescreen.ts
import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import { buildSubmission, isUuid, telescreenConfigFromEnv, verifyWebhookSignature } from "../../src/lib/server/telescreenClient"
import { applyShip, applyT1Review, applyT2Award, applyT2Reject, latestUnpaidShipTime } from "../../src/lib/server/projectLog"
import type { Log } from "../../src/lib/types"

let passed = 0
const test = (name: string, fn: () => void) => {
	fn()
	passed++
	console.log(`ok - ${name}`)
}

const SECRET = "whsec_test"
const sign = (timestamp: string, body: string, secret = SECRET) =>
	"sha256=" + createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")
const NOW = 1_790_172_157
const BODY = JSON.stringify({ event: "ping", deliveryId: "9a7e2c4d-1b3f-4e6a-8c5d-7f0e1a2b3c4d", eventId: "alchemize" })

test("accepts a valid signature", () => {
	assert.equal(verifyWebhookSignature(SECRET, String(NOW), sign(String(NOW), BODY), BODY, NOW), true)
})
test("accepts a timestamp within five minutes", () => {
	const ts = String(NOW - 299)
	assert.equal(verifyWebhookSignature(SECRET, ts, sign(ts, BODY), BODY, NOW), true)
})
test("refuses a replayed (old) delivery", () => {
	const ts = String(NOW - 301)
	assert.equal(verifyWebhookSignature(SECRET, ts, sign(ts, BODY), BODY, NOW), false)
})
test("refuses a tampered body", () => {
	assert.equal(verifyWebhookSignature(SECRET, String(NOW), sign(String(NOW), BODY), BODY.replace("ping", "outcome.set"), NOW), false)
})
test("refuses a signature made with another secret", () => {
	assert.equal(verifyWebhookSignature(SECRET, String(NOW), sign(String(NOW), BODY, "whsec_other"), BODY, NOW), false)
})
test("refuses missing or malformed headers, and an empty secret", () => {
	assert.equal(verifyWebhookSignature(SECRET, null, sign(String(NOW), BODY), BODY, NOW), false)
	assert.equal(verifyWebhookSignature(SECRET, String(NOW), null, BODY, NOW), false)
	assert.equal(verifyWebhookSignature(SECRET, "1790172157.5", sign("1790172157.5", BODY), BODY, NOW), false)
	assert.equal(verifyWebhookSignature(SECRET, String(NOW), "sha256=00", BODY, NOW), false)
	assert.equal(verifyWebhookSignature("", String(NOW), sign(String(NOW), BODY, ""), BODY, NOW), false)
})
test("a signature over a different timestamp doesn't verify", () => {
	assert.equal(verifyWebhookSignature(SECRET, String(NOW), sign(String(NOW - 1), BODY), BODY, NOW), false)
})

const project = {
	Name: " Ducky Drive ",
	code: "https://github.com/orpheus/ducky-drive",
	demo: "https://ducky.example.com",
	slackId: "U01AB2CD3EF",
	hackatime: "ducky-drive, ducky-api,ducky-drive",
}
const EXTERNAL_ID = "3f0c6a52-8d7e-4b1f-9a64-2c1e5b7d9f10"

test("submission carries only the minimal fields", () => {
	const submission = buildSubmission(project, EXTERNAL_ID, 4242)
	assert.notEqual(typeof submission, "string")
	assert.deepEqual(submission, {
		name: "Ducky Drive",
		kind: "hackatime",
		codeUrl: "https://github.com/orpheus/ducky-drive",
		demoUrl: "https://ducky.example.com",
		submitter: { slackId: "U01AB2CD3EF", hackatimeId: 4242 },
		hackatimeProjects: ["ducky-drive", "ducky-api"],
		externalId: EXTERNAL_ID,
	})
})
test("PII on the input never reaches the submission", () => {
	const withPii = { ...project, owner: "kid@example.com", firstName: "Ada", address: "1 Main St", unifiedId: "x" }
	const json = JSON.stringify(buildSubmission(withPii, EXTERNAL_ID))
	for (const value of ["kid@example.com", "Ada", "1 Main St", "unifiedId"]) assert.equal(json.includes(value), false)
})
test("omits an invalid demo link and an unknown Hackatime id", () => {
	const submission = buildSubmission({ ...project, demo: "javascript:alert(1)" }, EXTERNAL_ID, null)
	assert.ok(typeof submission !== "string")
	assert.equal("demoUrl" in submission, false)
	assert.deepEqual(submission.submitter, { slackId: "U01AB2CD3EF" })
})
test("refuses projects Robert would reject", () => {
	assert.equal(typeof buildSubmission({ ...project, code: "" }, EXTERNAL_ID), "string")
	assert.equal(typeof buildSubmission({ ...project, code: "ftp://x" }, EXTERNAL_ID), "string")
	assert.equal(typeof buildSubmission({ ...project, hackatime: " , " }, EXTERNAL_ID), "string")
	assert.equal(typeof buildSubmission({ ...project, slackId: "" }, EXTERNAL_ID), "string")
	assert.equal(typeof buildSubmission({ ...project, Name: "  " }, EXTERNAL_ID), "string")
	const tooMany = Array.from({ length: 51 }, (_, i) => `p${i}`).join(",")
	assert.equal(typeof buildSubmission({ ...project, hackatime: tooMany }, EXTERNAL_ID), "string")
})

test("isUuid only accepts UUIDs (they end up in URL paths)", () => {
	assert.equal(isUuid(EXTERNAL_ID), true)
	assert.equal(isUuid("../event"), false)
	assert.equal(isUuid(`${EXTERNAL_ID}/outcome`), false)
	assert.equal(isUuid(42), false)
})

test("config needs a ysws_ key; base URL defaults to telescreen.hackclub.com", () => {
	assert.equal(telescreenConfigFromEnv({}), null)
	assert.equal(telescreenConfigFromEnv({ ROBERT_API_KEY: "sk_wrong" }), null)
	assert.deepEqual(telescreenConfigFromEnv({ ROBERT_API_KEY: "ysws_abc", ROBERT_EVENT_SLUG: "alchemize" }), {
		baseUrl: "https://telescreen.hackclub.com", apiKey: "ysws_abc", webhookSecret: "", eventSlug: "alchemize",
	})
})

const at = (iso: string) => new Date(iso)
const review = { userExternal: "nice", internalNote: "", justification: "ok", reviewerName: "T1" }

test("latest unpaid ship time follows ships, not reviews", () => {
	let log: Log[] = applyShip([], 120, "first", at("2026-10-01T10:00:00Z"))
	assert.equal(latestUnpaidShipTime(log)?.toISOString(), "2026-10-01T10:00:00.000Z")
	log = applyT1Review(log, 0, "accept", review, at("2026-10-02T10:00:00Z"))
	// T1's review timestamp doesn't count as a ship
	assert.equal(latestUnpaidShipTime(log)?.toISOString(), "2026-10-01T10:00:00.000Z")
	// Shipping again while T1-approved and unpaid opens a new entry: the review submitted before it is out of date
	log = applyShip(log, 60, "more", at("2026-10-03T10:00:00Z"))
	assert.equal(latestUnpaidShipTime(log)?.toISOString(), "2026-10-03T10:00:00.000Z")
})
test("paid and rejected time isn't waiting", () => {
	let log: Log[] = applyShip([], 120, "first", at("2026-10-01T10:00:00Z"))
	log = applyT1Review(log, 0, "accept", review, at("2026-10-02T10:00:00Z"))
	log = applyT2Award(log, "j", "T2", at("2026-10-03T10:00:00Z"))
	assert.equal(latestUnpaidShipTime(log), null)
	let rejected: Log[] = applyShip([], 120, "first", at("2026-10-01T10:00:00Z"))
	rejected = applyT1Review(rejected, 0, "reject", review, at("2026-10-02T10:00:00Z"))
	assert.equal(latestUnpaidShipTime(rejected), null)
})
test("a reship after a rejection folds into the same entry and counts from the new ship", () => {
	let log: Log[] = applyShip([], 120, "first", at("2026-10-01T10:00:00Z"))
	log = applyT1Review(log, 0, "reject", review, at("2026-10-02T10:00:00Z"))
	log = applyShip(log, 30, "fixed", at("2026-10-04T10:00:00Z"))
	assert.equal(log.length, 1)
	assert.equal(latestUnpaidShipTime(log)?.toISOString(), "2026-10-04T10:00:00.000Z")
})

test("Telescreen rejection keeps the participant text generic and labels it for reviewers", () => {
	let log: Log[] = applyShip([], 120, "first", at("2026-10-01T10:00:00Z"))
	log = applyT1Review(log, 0, "accept", review, at("2026-10-02T10:00:00Z"))
	const rejected = applyT2Reject(log, "generic", at("2026-10-03T10:00:00Z"), { internalNote: "Rejected by Telescreen fraud review (trust score 3)", reviewerName: "Telescreen" })
	const message = rejected.at(-1)!.message.at(-1)!
	assert.equal(rejected.at(-1)!.status, 2)
	assert.equal(message.reviewerName, "Telescreen")
	assert.equal(message.internalNote, "Rejected by Telescreen fraud review (trust score 3)")
	assert.equal(message.userExternal.includes("trust score"), false)
	// Default labels unchanged for T2 returns
	const t2 = applyT2Reject(log, "reason", at("2026-10-03T10:00:00Z")).at(-1)!.message.at(-1)!
	assert.equal(t2.reviewerName, "T2 Reviewer")
	assert.equal(t2.internalNote, "Rejected at T2")
	// Nothing to reject: the same log comes back (callers rely on identity to skip the write)
	const paid = applyT2Award(log, "j", "T2")
	assert.equal(applyT2Reject(paid, "generic"), paid)
})

console.log(`\n${passed} tests passed`)
