// import { PII_ENCRYPTION_KEY } from "$env/static/private"
import dotenv from "dotenv"
dotenv.config()
const  PII_ENCRYPTION_KEY  = process.env.PII_ENCRYPTION_KEY || "default_key_32_bytes_long_1234567890"; // Ensure this is 32 bytes for AES-256
// console.log("PII_ENCRYPTION_KEY:", PII_ENCRYPTION_KEY); // Debugging line to check the key
import crypto from "crypto"
export const encryptAES = (text: string, iv: Buffer) => {
	const algorithm = 'aes-256-gcm';
	const cipher = crypto.createCipheriv(
		algorithm,
		Buffer.from(PII_ENCRYPTION_KEY, "hex"),
		iv
	)
	let encrypted = cipher.update(text, 'utf8', 'hex')
	encrypted += cipher.final('hex')
	const authTag = cipher.getAuthTag().toString('hex')
	return {
		iv: iv.toString('hex'),
		encryptedData: encrypted,
		authTag: authTag,
		finalString: `${encrypted}:${authTag}`
	}
}
export const decryptAES = (encryptedDataWithTag: string, ivHex: string) => {
	if (!encryptedDataWithTag || !ivHex) return '';
		const algorithm = 'aes-256-gcm';
	
	const key = Buffer.from(PII_ENCRYPTION_KEY, 'hex');
	const iv = Buffer.from(ivHex, 'hex');
	const [encryptedText, authTagHex] = encryptedDataWithTag.split(':');
	
	const decipher = crypto.createDecipheriv(algorithm, key, iv);
	decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
	
	let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
	decrypted += decipher.final('utf8');
	
	return decrypted;
}