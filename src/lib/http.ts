// Best-effort human-readable message from a failed fetch Response. Endpoints answer with plain text,
// or JSON { message } (SvelteKit `error()` when the request sends Accept: application/json).
export const readErrorMessage = async (response: Response, fallback: string): Promise<string> => {
	const text = await response.text().catch(() => "")
	try {
		const data = JSON.parse(text)
		if (typeof data?.message === "string" && data.message !== "") return data.message
	} catch {
		// not JSON
	}
	const trimmed = text.trim()
	return trimmed !== "" && trimmed.length <= 300 && !trimmed.startsWith("<") ? trimmed : fallback
}
