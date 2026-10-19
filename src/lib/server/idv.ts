import type { IdvStatus } from "$lib/idv"

const CHECK_URL = "https://auth.hackclub.com/api/external/check"

// Live status from Hack Club Auth. The session's verification_status is frozen at login (up to 30 days old),
// so it is never used for this. Looked up by Hack Club Auth id, which (unlike the email) can't change.
export const getIdvStatus = async (user: { id: string, email: string }): Promise<IdvStatus> => {
	const params = new URLSearchParams(user.id?.startsWith("ident!") ? { idv_id: user.id } : { email: user.email })
	try {
		const response = await fetch(`${CHECK_URL}?${params}`, { signal: AbortSignal.timeout(10_000) })
		if (!response.ok) {
			console.error("Hack Club Auth eligibility check failed:", response.status)
			return "unavailable"
		}
		const { result } = await response.json()
		switch (result) {
			case "verified_eligible":
				return "verified"
			case "pending":
				return "pending"
			case "verified_but_over_18":
			case "rejected":
				return "ineligible"
			case "needs_submission":
				return "needs_submission"
			case "not_found":
				// The user logged in through Hack Club Auth, so this should not happen
				console.warn("Hack Club Auth eligibility check found no account for a logged-in user")
				return "needs_submission"
			default:
				console.error("Hack Club Auth eligibility check returned an unknown result:", result)
				return "unavailable"
		}
	} catch (error) {
		console.error("Hack Club Auth eligibility check failed:", (error as Error).message)
		return "unavailable"
	}
}
