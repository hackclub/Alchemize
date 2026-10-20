// Tests for src/lib/server/hackatimeToken.ts (imports the real module; needs no database).
// Run: npx tsx testing/manualTests/test-hackatimeToken.ts
import assert from "node:assert/strict"
import crypto from "node:crypto"
import { decryptHackatimeToken, encryptHackatimeToken, isEncryptedHackatimeToken } from "../../src/lib/server/hackatimeToken"

// The module reads the key per call, so setting it after the import is fine
process.env.PII_ENCRYPTION_KEY = crypto.randomBytes(32).toString("hex")

let passed = 0
const test = (name: string, fn: () => void) => {
	fn()
	passed++
	console.log(`ok - ${name}`)
}

const token = "ht_" + crypto.randomBytes(32).toString("base64url")

test("a token round-trips and is stored in the iv:ciphertext:tag form", () => {
	const stored = encryptHackatimeToken(token)
	assert.notEqual(stored, token)
	assert.equal(isEncryptedHackatimeToken(stored), true)
	assert.match(stored, /^[0-9a-f]{24}:[0-9a-f]+:[0-9a-f]{32}$/)
	assert.equal(stored.length, token.length * 2 + 58)
	assert.equal(decryptHackatimeToken(stored), token)
})

test("every encryption uses a fresh IV", () => {
	assert.notEqual(encryptHackatimeToken(token), encryptHackatimeToken(token))
})

test("empty means not connected and stays empty", () => {
	assert.equal(encryptHackatimeToken(""), "")
	assert.equal(decryptHackatimeToken(""), "")
	assert.equal(isEncryptedHackatimeToken(""), false)
})

test("legacy plaintext rows are returned as they are", () => {
	assert.equal(isEncryptedHackatimeToken(token), false)
	assert.equal(decryptHackatimeToken(token), token)
	// Colons alone don't make a value look encrypted
	const withColons = "abc:def:ghi"
	assert.equal(isEncryptedHackatimeToken(withColons), false)
	assert.equal(decryptHackatimeToken(withColons), withColons)
	const hexButWrongShape = "00112233445566778899aabb:deadbeef:0011"
	assert.equal(isEncryptedHackatimeToken(hexButWrongShape), false)
	assert.equal(decryptHackatimeToken(hexButWrongShape), hexButWrongShape)
})

test("a tampered or re-keyed ciphertext throws instead of returning garbage", () => {
	const stored = encryptHackatimeToken(token)
	const [iv, ciphertext, tag] = stored.split(":")
	const flipped = (ciphertext[0] === "0" ? "1" : "0") + ciphertext.slice(1)
	assert.throws(() => decryptHackatimeToken(`${iv}:${flipped}:${tag}`))
	const key = process.env.PII_ENCRYPTION_KEY
	process.env.PII_ENCRYPTION_KEY = crypto.randomBytes(32).toString("hex")
	assert.throws(() => decryptHackatimeToken(stored))
	process.env.PII_ENCRYPTION_KEY = key
	assert.equal(decryptHackatimeToken(stored), token)
})

test("a missing or malformed key is refused up front", () => {
	const key = process.env.PII_ENCRYPTION_KEY
	for (const bad of [undefined, "", "abc", "z".repeat(64), "0".repeat(63)]) {
		if (bad === undefined) delete process.env.PII_ENCRYPTION_KEY
		else process.env.PII_ENCRYPTION_KEY = bad
		assert.throws(() => encryptHackatimeToken(token), /PII_ENCRYPTION_KEY/)
	}
	process.env.PII_ENCRYPTION_KEY = key
})

console.log(`\n${passed} passed`)
