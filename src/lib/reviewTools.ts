/** Base URLs for external Hackatime fraud-review tools used by T2 reviewers. */
export const HACKATIME_BILLY_BASE_URL = "https://billy.3kh0.net/"
export const HACKATIME_JOE_FRAUD_BASE_URL = "https://joe.fraud.hackclub.com/billy"

/** Fallback start date for review windows, matching the Hackatime heartbeat window used by analyzeHackatime. */
export const HACKATIME_REVIEW_START_DATE = "2026-06-18"

export function buildBillyUrl(hackatimeId: string, start: string, end: string): string {
	return `${HACKATIME_BILLY_BASE_URL}?u=${encodeURIComponent(hackatimeId)}&d=${encodeURIComponent(`${start}-${end}`)}`
}

export function buildJoeFraudUrl(hackatimeId: string, start: string, end: string): string {
	return `${HACKATIME_JOE_FRAUD_BASE_URL}?u=${encodeURIComponent(hackatimeId)}&d=${encodeURIComponent(`${start}-${end}`)}`
}
