// Uploads are forwarded to the Hack Club CDN with Alchemize's shared upload secret, so only real images are
// accepted: the type is decided from the file's leading bytes (not its claimed MIME type or name), and the file is
// re-wrapped with a fixed name and that content type before it leaves the server.

// Matches the "up to 5MB" shown in the upload dialogs
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

const sniffImageType = (head: Uint8Array): { mime: string, extension: string } | null => {
	const startsWith = (bytes: number[], offset = 0) => bytes.every((byte, i) => head[offset + i] === byte)
	const ascii = (text: string, offset = 0) => startsWith([...text].map(char => char.charCodeAt(0)), offset)
	if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: "image/png", extension: "png" }
	if (startsWith([0xff, 0xd8, 0xff])) return { mime: "image/jpeg", extension: "jpg" }
	if (ascii("GIF87a") || ascii("GIF89a")) return { mime: "image/gif", extension: "gif" }
	if (ascii("RIFF") && ascii("WEBP", 8)) return { mime: "image/webp", extension: "webp" }
	return null
}

export type ImageCheck =
	| { ok: true, file: File | null } // null: nothing was uploaded (empty file input)
	| { ok: false, message: string }

export const checkImageUpload = async (value: FormDataEntryValue | null, label: string): Promise<ImageCheck> => {
	if (value === null || typeof value === "string" || value.size === 0) {
		return { ok: true, file: null }
	}
	if (value.size > MAX_IMAGE_BYTES) {
		return { ok: false, message: `${label} must be at most 5MB` }
	}
	const type = sniffImageType(new Uint8Array(await value.slice(0, 12).arrayBuffer()))
	if (!type) {
		return { ok: false, message: `${label} must be a PNG, JPEG, GIF or WebP image` }
	}
	return { ok: true, file: new File([value], `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${type.extension}`, { type: type.mime }) }
}
