// Referral codes identify the referrer as "<Hack Club Auth id without 'ident!'> <Slack ID>" (the format stored in
// refers.referer). Pure functions with keys passed in, so testing/manualTests/test-referralCode.ts can run them.
import crypto from "crypto"

const CODE_PREFIX = "r1."
const SLACK_ID = /^[UW][A-Z0-9]{6,20}$/

// Signed with a key derived from an existing server secret, so no new secret needs to be configured
export const deriveReferralKey = (serverSecret: string): Buffer =>
	crypto.createHmac("sha256", serverSecret).update("alchemize-referral-v1").digest()

const sign = (payload: string, key: Buffer): Buffer =>
	crypto.createHmac("sha256", key).update(payload).digest().subarray(0, 16)

const isValidReferer = (referer: string): boolean => {
	const parts = referer.split(" ")
	if (parts.length !== 2) return false
	const [userId, slackId] = parts
	return userId !== "" && !userId.startsWith("ident!") && SLACK_ID.test(slackId)
}

export const createReferralCode = (hackClubId: string, slackId: string, key: Buffer): string => {
	const referer = `${hackClubId.replace(/^ident!/, "")} ${slackId}`
	return CODE_PREFIX + Buffer.from(referer).toString("base64url") + "." + sign(referer, key).toString("base64url")
}

export interface ParsedReferral {
	referer: string
	// Legacy codes used repeating-key XOR, which anyone can forge after seeing one code, so they are only
	// trusted once the referer has been matched to an existing user
	legacy: boolean
}

export const parseReferralCode = (code: string, key: Buffer, legacyXorKeyHex: string): ParsedReferral | null => {
	if (code.startsWith(CODE_PREFIX)) {
		const [payload, signature, extra] = code.slice(CODE_PREFIX.length).split(".")
		if (!payload || !signature || extra !== undefined) return null
		const referer = Buffer.from(payload, "base64url").toString("utf-8")
		const expected = sign(referer, key)
		const given = Buffer.from(signature, "base64url")
		if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null
		return isValidReferer(referer) ? { referer, legacy: false } : null
	}
	const bytes = Buffer.from(code, "base64")
	const xorKey = Buffer.from(legacyXorKeyHex ?? "", "hex")
	const out = Buffer.alloc(bytes.length)
	for (let i = 0; i < bytes.length; i++) {
		out[i] = xorKey.length > 0 ? bytes[i] ^ xorKey[i % xorKey.length] : bytes[i]
	}
	const referer = out.toString("utf-8")
	return isValidReferer(referer) ? { referer, legacy: true } : null
}
