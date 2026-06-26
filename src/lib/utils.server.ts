import { PII_ENCRYPTION_KEY } from "$env/static/private"
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