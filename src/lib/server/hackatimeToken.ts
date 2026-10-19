// Encryption at rest for the Hackatime OAuth token (users.hackatime). AES-256-GCM under PII_ENCRYPTION_KEY with
// the same "iv:ciphertext:tag" layout as encryptAES in $lib/utils.server, but with the key read from process.env,
// so db.ts can import it: db.ts is also loaded by drizzle-kit and by scripts run with tsx, where $env doesn't exist.
import crypto from "node:crypto"

const ALGORITHM = "aes-256-gcm"
// 12-byte IV, ciphertext, 16-byte auth tag; all lowercase hex, as Buffer#toString("hex") writes it
const ENCRYPTED_TOKEN = /^[0-9a-f]{24}:[0-9a-f]+:[0-9a-f]{32}$/

// Read per call, never at import: ES imports run before db.ts's dotenv.config(), and drizzle-kit loads db.ts with
// no key at all (it only needs the schema).
const key = (): Buffer => {
	const hex = process.env.PII_ENCRYPTION_KEY ?? ""
	if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
		throw new Error("PII_ENCRYPTION_KEY must be 32 bytes as 64 hexadecimal characters")
	}
	return Buffer.from(hex, "hex")
}

export const isEncryptedHackatimeToken = (stored: string): boolean => ENCRYPTED_TOKEN.test(stored)

// "" stays "": it is the "Hackatime not connected" marker that hasHackatime (coalesce(hackatime, '') <> '') relies on
export const encryptHackatimeToken = (token: string): string => {
	if (token === "") return ""
	const iv = crypto.randomBytes(12)
	const cipher = crypto.createCipheriv(ALGORITHM, key(), iv)
	const ciphertext = cipher.update(token, "utf8", "hex") + cipher.final("hex")
	return `${iv.toString("hex")}:${ciphertext}:${cipher.getAuthTag().toString("hex")}`
}

// A stored value that isn't in the encrypted form is a legacy plaintext token (from before tokens were encrypted)
// and is returned as it is, until script/encryptHackatimeTokens.ts re-encrypts it. An encrypted value that doesn't
// authenticate (wrong key, corrupted row) throws: that's a deployment problem to fix, not a reason to silently
// treat everyone as disconnected and make them link Hackatime again.
export const decryptHackatimeToken = (stored: string): string => {
	if (stored === "" || !isEncryptedHackatimeToken(stored)) return stored
	const [ivHex, ciphertext, tagHex] = stored.split(":")
	const decipher = crypto.createDecipheriv(ALGORITHM, key(), Buffer.from(ivHex, "hex"))
	decipher.setAuthTag(Buffer.from(tagHex, "hex"))
	return decipher.update(ciphertext, "hex", "utf8") + decipher.final("utf8")
}
