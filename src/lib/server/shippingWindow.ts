// When projects can be shipped, from SHIPPING_OPENS_AT / SHIPPING_CLOSES_AT (ISO 8601, read at runtime, so a season
// can be opened or closed by changing env and restarting, without a code change).
// Shipping moves money, so it is closed unless SHIPPING_OPENS_AT is set, and an unparsable value keeps it closed.
// Pure, so testing/manualTests/test-shippingWindow.ts can run it.

export type ShippingWindowState = { open: true } | { open: false; message: string }

const parseDate = (value: string | undefined): Date | null | "invalid" => {
	if (value === undefined || value.trim() === "") return null
	const date = new Date(value.trim())
	return Number.isNaN(date.getTime()) ? "invalid" : date
}

const formatUtc = (date: Date) =>
	date
		.toISOString()
		.replace("T", " ")
		.replace(/:\d\d\.\d{3}Z$/, " UTC")

export const getShippingWindowState = (
	env: { SHIPPING_OPENS_AT?: string; SHIPPING_CLOSES_AT?: string },
	now: Date = new Date()
): ShippingWindowState => {
	const opensAt = parseDate(env.SHIPPING_OPENS_AT)
	const closesAt = parseDate(env.SHIPPING_CLOSES_AT)
	if (opensAt === "invalid" || closesAt === "invalid") {
		console.error("SHIPPING_OPENS_AT / SHIPPING_CLOSES_AT is not a valid date; shipping stays closed")
		return { open: false, message: "Shipping is closed right now. Please check #alchemize for the next season." }
	}
	if (opensAt === null) {
		return { open: false, message: "Shipping is closed right now. Please check #alchemize for the next season." }
	}
	if (now < opensAt) {
		return { open: false, message: `Shipping opens at ${formatUtc(opensAt)}.` }
	}
	if (closesAt !== null && now >= closesAt) {
		return {
			open: false,
			message: `Shipping for this season closed at ${formatUtc(closesAt)}. Please contact #alchemize-help for assistance.`,
		}
	}
	return { open: true }
}
