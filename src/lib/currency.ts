// Alchemize has a single currency, Aqua Regia: 1 Aqua Regia = 1 approved hour = $5.
// Every amount (balances, prices, ledger entries) is an integer number of hundredths of a unit,
// so no floating point ever touches money. Convert to units only for display.
export const CURRENCY_NAME = "Aqua Regia"
// Value written to ledger.currencyType for every entry made after the single-currency migration
export const CURRENCY_KEY = "aqua_regia"
export const HUNDREDTHS_PER_UNIT = 100
// Postgres `integer` upper bound; balances, prices and order totals must stay below it
export const MAX_HUNDREDTHS = 2_147_483_647

// Whole-unit amount (e.g. an admin typing "66.4") -> hundredths. Returns null for anything not representable.
export const unitsToHundredths = (units: unknown): number | null => {
	if (typeof units !== "number" || !Number.isFinite(units)) return null
	const hundredths = Math.round(units * HUNDREDTHS_PER_UNIT)
	if (!Number.isSafeInteger(hundredths) || Math.abs(hundredths) > MAX_HUNDREDTHS) return null
	return hundredths
}

export const hundredthsToUnits = (hundredths: number): number => hundredths / HUNDREDTHS_PER_UNIT

// Approved Hackatime minutes -> hundredths of Aqua Regia, rounded down to the nearest hundredth
export const minutesToHundredths = (minutes: number): number =>
	Math.floor((minutes * HUNDREDTHS_PER_UNIT) / 60)

// "66.4", "5", "0.8" — no trailing zeros, at most two decimals
export const formatAquaAmount = (hundredths: number): string =>
	hundredthsToUnits(hundredths ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })

// "66.4 Aqua Regia"
export const formatAqua = (hundredths: number): string => `${formatAquaAmount(hundredths)} ${CURRENCY_NAME}`
