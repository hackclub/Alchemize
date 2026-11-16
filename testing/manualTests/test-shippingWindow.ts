// Tests for src/lib/server/shippingWindow.ts (imports the real module).
// Run: npx tsx testing/manualTests/test-shippingWindow.ts
import assert from "node:assert/strict"
import { getShippingWindowState } from "../../src/lib/server/shippingWindow"

const now = new Date("2026-11-01T12:00:00Z")
const state = (opens?: string, closes?: string) =>
	getShippingWindowState({ SHIPPING_OPENS_AT: opens, SHIPPING_CLOSES_AT: closes }, now)

assert.equal(state().open, false, "closed until a season is configured")
assert.equal(state("", "").open, false)
console.log("ok - closed by default (nothing configured)")

assert.equal(state("2026-10-20T00:00:00Z").open, true, "open-ended season")
assert.equal(state("2026-10-20T00:00:00Z", "2026-11-09T00:00:00Z").open, true)
console.log("ok - open inside the window, with or without an end")

assert.match((state("2026-11-02T00:00:00Z") as { message: string }).message, /opens at 2026-11-02 00:00 UTC/)
assert.match(
	(state("2026-10-01T00:00:00Z", "2026-11-01T12:00:00Z") as { message: string }).message,
	/closed at 2026-11-01 12:00 UTC/,
	"closing time is exclusive"
)
console.log("ok - closed before the start and from the closing time on, with the time in the message")

assert.equal(state("next tuesday").open, false)
assert.equal(state("2026-10-20T00:00:00Z", "soon").open, false)
console.log("ok - an unparsable date keeps shipping closed")
