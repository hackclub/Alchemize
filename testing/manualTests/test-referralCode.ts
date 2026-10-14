// Tests for src/lib/server/referralCode.ts (imports the real module).
// Run: npx tsx testing/manualTests/test-referralCode.ts
import assert from "node:assert/strict"
import { createReferralCode, deriveReferralKey, parseReferralCode } from "../../src/lib/server/referralCode"

const key = deriveReferralKey("server-secret")
const legacyKey = "a1b2c3d4"
const legacyEncode = (text: string, hex: string) => {
	const k = Buffer.from(hex, "hex"), b = Buffer.from(text)
	return Buffer.from(b.map((byte, i) => byte ^ k[i % k.length])).toString("base64")
}

const code = createReferralCode("ident!abc123", "U0ABCDEF12", key)
assert.match(code, /^r1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, "URL-safe")
assert.deepEqual(parseReferralCode(code, key, legacyKey), { referer: "abc123 U0ABCDEF12", legacy: false })
console.log("ok - signed code round-trips to the stored referer format")

assert.equal(parseReferralCode(code, deriveReferralKey("other-secret"), legacyKey), null)
const [prefix, , signature] = code.split(".")
const forged = `${prefix}.${Buffer.from("abc123 U0ATTACKER1").toString("base64url")}.${signature}`
assert.equal(parseReferralCode(forged, key, legacyKey), null)
assert.equal(parseReferralCode(code + "x", key, legacyKey), null)
assert.equal(parseReferralCode(code + ".extra", key, legacyKey), null)
console.log("ok - signed codes can't be forged, re-keyed or tampered with")

assert.deepEqual(parseReferralCode(legacyEncode("abc123 U0ABCDEF12", legacyKey), key, legacyKey), { referer: "abc123 U0ABCDEF12", legacy: true })
assert.deepEqual(parseReferralCode(legacyEncode("abc123 U0ABCDEF12", ""), key, ""), { referer: "abc123 U0ABCDEF12", legacy: true }, "empty legacy key = identity, as before")
console.log("ok - legacy XOR codes still parse, flagged as legacy (must be matched to a real user)")

for (const junk of ["", "QUFBQQ", "!!!", legacyEncode("ident!abc U0ABCDEF12", legacyKey), legacyEncode("abc U0ABCDEF12 extra", legacyKey), legacyEncode("abc not-a-slack-id", legacyKey)]) {
	assert.equal(parseReferralCode(junk, key, legacyKey), null, `accepted ${JSON.stringify(junk)}`)
}
console.log("ok - junk and malformed codes are rejected without throwing")
