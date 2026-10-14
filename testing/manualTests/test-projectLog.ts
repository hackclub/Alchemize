// Regression tests for the project log math in src/lib/server/projectLog.ts (imports the real module).
// Run: npx tsx testing/manualTests/test-projectLog.ts
import assert from "node:assert/strict"
import {
	applyShip,
	applyT1Review,
	applyT2Award,
	applyT2Reject,
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
