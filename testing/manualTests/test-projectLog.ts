// Regression tests for the project log math in src/lib/server/projectLog.ts (imports the real module).
// Run: npx tsx testing/manualTests/test-projectLog.ts
import assert from "node:assert/strict"
import {
	applyShip,
	applyT1Review,
	applyT2Award,
	applyT2Reject,
	approvedAtT1By,
	calculateNewMinutes,
	calculateRecordedTime,
	calculateShipDelta,
	hasUnpushedApprovedEntries,
	isOwnProject,
	parseDeductionMinutes,
	sharesHackatimeProject,
} from "../../src/lib/server/projectLog"
import type { Log } from "../../src/lib/types"

let passed = 0
const test = (name: string, fn: () => void) => {
	fn()
	passed++
	console.log(`ok - ${name}`)
}

const review = { userExternal: "feedback", internalNote: "", justification: "j", reviewerName: "Reviewer" }
const ship = (log: Log[], hackatimeMinutes: number) => applyShip(log, calculateShipDelta(hackatimeMinutes, log), "changelog")
const t1 = (log: Log[], hours: number, decision: "accept" | "reject") => {
	const minutes = parseDeductionMinutes(hours, log.at(-1), decision)
	assert.equal(typeof minutes, "number", `deduction refused: ${minutes}`)
	return applyT1Review(log, minutes as number, decision, review)
}

test("T1 deductions are not claimable again on the next ship", () => {
	let log = ship([], 600) // Hackatime shows 10h
	assert.equal(log.at(-1)!.deltaTime, 600)
	log = t1(log, 4, "accept") // reviewer removes 4h
	assert.equal(log.at(-1)!.deltaTime, 360)
	assert.equal(log.at(-1)!.deductedMinutes, 240)
	assert.equal(calculateNewMinutes(log), 360) // T2 pays 6h
	log = applyT2Award(log, "j", "T2")
	log = ship(log, 600) // no new Hackatime time
	assert.equal(log.at(-1)!.deltaTime, 0, "the deducted 4h must not come back")
})

test("a deduction on a rejected entry survives the re-ship", () => {
	let log = ship([], 600)
	log = t1(log, 2, "reject")
	assert.equal(log.at(-1)!.status, 2)
	log = ship(log, 660) // 1h of new work
	assert.equal(log.length, 1, "re-ship folds into the rejected entry")
	assert.equal(log.at(-1)!.status, 0)
	assert.equal(log.at(-1)!.deltaTime, 480 + 60, "8h left after the deduction plus the new hour")
	assert.equal(log.at(-1)!.deductedMinutes, 120)
	assert.equal(calculateRecordedTime(log), 660)
})

test("legacy entries without deductedMinutes still count their delta", () => {
	const legacy: Log[] = [{ status: 1, timestamp: "", deltaTime: 300, message: [], submmitedToHQ: true, fraudApproved: false }]
	assert.equal(calculateRecordedTime(legacy), 300)
	assert.equal(calculateShipDelta(420, legacy), 120)
})

test("a negative delta can be rejected but not accepted", () => {
	let log = applyT2Award(t1(ship([], 600), 0, "accept"), "j", "T2")
	assert.equal(calculateShipDelta(540, log), -60, "Hackatime total dropped below what was recorded")
	// The ship endpoint refuses negative deltas; an existing negative entry must still be reviewable
	log = applyShip(log, -60, "changelog")
	assert.match(String(parseDeductionMinutes(0, log.at(-1), "accept")), /negative time/)
	assert.equal(parseDeductionMinutes(null, log.at(-1), "reject"), 0)
	assert.match(String(parseDeductionMinutes(1, log.at(-1), "reject")), /Cannot deduct/)
})

test("deductions are validated", () => {
	const log = ship([], 120)
	assert.match(String(parseDeductionMinutes(-1, log.at(-1), "accept")), /non-negative/)
	assert.match(String(parseDeductionMinutes(Number.NaN, log.at(-1), "accept")), /non-negative/)
	assert.match(String(parseDeductionMinutes("1", log.at(-1), "accept")), /non-negative/)
	assert.match(String(parseDeductionMinutes(3, log.at(-1), "accept")), /Cannot deduct/)
	assert.equal(parseDeductionMinutes(2, log.at(-1), "accept"), 120)
	assert.match(String(parseDeductionMinutes(0, undefined, "accept")), /no log/)
})

test("entries already sent to HQ cannot be reviewed again", () => {
	const log = applyT2Award(t1(ship([], 120), 0, "accept"), "j", "T2")
	assert.match(String(parseDeductionMinutes(0, log.at(-1), "accept")), /already been sent to HQ/)
	assert.equal(hasUnpushedApprovedEntries(log), false)
	assert.equal(calculateNewMinutes(log), 0)
})

test("only a pending entry can be accepted at T1; a rejection is overturned by shipping again", () => {
	// Rejected at T1: no re-accept, reject still works, and the re-ship makes it acceptable again
	let log = t1(ship([], 120), 0, "reject")
	assert.match(String(parseDeductionMinutes(0, log.at(-1), "accept")), /already rejected/)
	assert.match(String(parseDeductionMinutes(null, log.at(-1), "accept")), /Only a pending review can be accepted/)
	assert.equal(parseDeductionMinutes(0, log.at(-1), "reject"), 0, "a rejected entry can still be rejected")
	log = ship(log, 180)
	assert.equal(log.at(-1)!.status, 0)
	assert.equal(parseDeductionMinutes(1, log.at(-1), "accept"), 60)
	// Rejected at T2: same, the T1 reviewer can't quietly put it back on the T2 queue
	log = applyT2Reject(t1(log, 0, "accept"), "not enough work")
	assert.equal(log.at(-1)!.status, 2)
	assert.match(String(parseDeductionMinutes(0, log.at(-1), "accept")), /already rejected/)
	assert.equal(parseDeductionMinutes(0, log.at(-1), "reject"), 0)
	assert.equal(parseDeductionMinutes(0, ship(log, 180).at(-1), "accept"), 0, "acceptable again once the participant ships")
	// Already approved and waiting for T2: not approved twice, but a T1 reviewer can still reject it
	const approved = t1(ship([], 120), 0, "accept")
	assert.match(String(parseDeductionMinutes(0, approved.at(-1), "accept")), /already approved/)
	assert.equal(parseDeductionMinutes(0.5, approved.at(-1), "reject"), 30)
	// The HQ message still wins for entries already paid
	const paid = applyT2Award(approved, "j", "T2")
	assert.match(String(parseDeductionMinutes(0, paid.at(-1), "accept")), /already been sent to HQ/)
})

test("the T1 approver may not award the same time at T2 (by Slack ID, name as fallback)", () => {
	const alice = { slackId: "U1", name: "Alice" }
	const bob = { slackId: "U2", name: "Bob" }
	const t1By = (log: Log[], who: { slackId: string, name: string }, decision: "accept" | "reject") =>
		applyT1Review(log, 0, decision, { ...review, reviewerName: who.name, reviewerSlackId: who.slackId })
	const approved = t1By(ship([], 120), alice, "accept")
	assert.equal(approved.at(-1)!.message.at(-1)!.reviewerSlackId, "U1", "an approval records the approver's Slack ID")
	assert.equal(approvedAtT1By(approved, alice), true)
	assert.equal(approvedAtT1By(approved, { slackId: "U1", name: "Alice Renamed" }), true, "a renamed admin is still the approver")
	assert.equal(approvedAtT1By(approved, bob), false)
	assert.equal(approvedAtT1By(approved, { slackId: "U2", name: "Alice" }), true, "same name, other ID: refused (fails closed)")
	assert.equal(approvedAtT1By(approved, { slackId: "", name: "" }), false, "empty values never match")
	assert.equal(approvedAtT1By(approved, { slackId: "U2", name: "APPROVED Alice" }), false)
	// Approvals recorded before the ID existed are matched by name
	const legacy = applyT1Review(ship([], 120), 0, "accept", { ...review, reviewerName: "Alice" })
	assert.equal(legacy.at(-1)!.message.at(-1)!.reviewerSlackId, undefined)
	assert.equal(approvedAtT1By(legacy, alice), true)
	assert.equal(approvedAtT1By(legacy, { slackId: "U1", name: "Alice Renamed" }), false, "without an ID only the name can match")
	assert.equal(approvedAtT1By(legacy, bob), false)
	// A rejection records no ID: rejecting an earlier cycle doesn't block that reviewer once someone else approves
	const rejectedByBob = t1By(ship([], 120), bob, "reject")
	assert.equal(rejectedByBob.at(-1)!.message.at(-1)!.reviewerSlackId, undefined)
	const approvedByAlice = t1By(ship(rejectedByBob, 180), alice, "accept")
	assert.equal(approvedAtT1By(approvedByAlice, bob), false)
	assert.equal(approvedAtT1By(approvedByAlice, alice), true)
	// Pending or rejected entries are not payable, so they don't count
	assert.equal(approvedAtT1By(ship([], 120), { slackId: "U0", name: "user" }), false)
	assert.equal(approvedAtT1By(rejectedByBob, bob), false)
	assert.equal(approvedAtT1By(applyT2Reject(approved, "x"), alice), false)
	// Once paid, the entry is out of scope; only the time still waiting for HQ matters
	const paid = applyT2Award(approved, "j", "T2")
	assert.equal(approvedAtT1By(paid, alice), false)
	assert.equal(approvedAtT1By(paid, { slackId: "U9", name: "T2" }), false)
	// A second cycle approved by someone else: that approver is blocked, the first one is free again
	const second = t1By(ship(paid, 240), bob, "accept")
	assert.equal(approvedAtT1By(second, bob), true)
	assert.equal(approvedAtT1By(second, alice), false)
	// A re-ship after a rejection keeps the old APPROVED message in the entry, but the entry is pending again
	const reshipped = ship(applyT2Reject(approved, "x"), 180)
	assert.equal(reshipped.at(-1)!.status, 0)
	assert.equal(approvedAtT1By(reshipped, alice), false)
	assert.equal(approvedAtT1By(t1By(reshipped, alice, "accept"), alice), true, "approving it again at T1 blocks them again")
})

test("T2 rejection marks the entry rejected and leaves paid entries alone", () => {
	const approved = t1(ship([], 120), 0, "accept")
	const rejected = applyT2Reject(approved, "not enough work")
	assert.equal(rejected.at(-1)!.status, 2)
	assert.equal(rejected.at(-1)!.deltaTime, 120)
	assert.equal(hasUnpushedApprovedEntries(rejected), false)
	const paid = applyT2Award(approved, "j", "T2")
	assert.deepEqual(applyT2Reject(paid, "x"), paid)
})

test("reviewers cannot review their own projects", () => {
	assert.equal(isOwnProject({ slackId: "U1", email: "a@x.com" }, { slackId: "U1", owner: "b@x.com" }), true)
	assert.equal(isOwnProject({ slackId: "U2", email: "A@X.com " }, { slackId: "U1", owner: "a@x.com" }), true)
	assert.equal(isOwnProject({ slackId: "U2", email: "c@x.com" }, { slackId: "U1", owner: "a@x.com" }), false)
	assert.equal(isOwnProject({ slackId: "", email: "" }, { slackId: "", owner: "" }), false, "empty values never match")
})

test("Hackatime project overlap, including comma-separated lists", () => {
	assert.equal(sharesHackatimeProject("game", "game"), true)
	assert.equal(sharesHackatimeProject("game, engine", "engine"), true)
	assert.equal(sharesHackatimeProject("game", "Game"), false, "Hackatime names are case-sensitive")
	assert.equal(sharesHackatimeProject("", ""), false)
	assert.equal(sharesHackatimeProject("game", "other"), false)
})

console.log(`\n${passed} passed`)
