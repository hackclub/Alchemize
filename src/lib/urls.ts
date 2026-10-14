// Project demo/repo links are user input that ends up as clickable links in the reviewer panels.
// Only http(s) URLs are accepted: URL.canParse alone also allows javascript:, data:, file: etc.
export const isHttpUrl = (value: unknown): value is string => {
	if (typeof value !== "string" || value.trim() === "") return false
	try {
		const url = new URL(value.trim())
		return url.protocol === "https:" || url.protocol === "http:"
	} catch {
		return false
	}
}

// For href attributes: anything that is not an http(s) URL renders as a dead link instead of running
export const safeHref = (value: unknown): string | undefined => (isHttpUrl(value) ? value.trim() : undefined)
