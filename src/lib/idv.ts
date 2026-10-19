// Hack Club Auth identity verification, as far as shipping on Alchemize is concerned. Shared by the ship
// endpoint (enforcement) and the project dialog (disabled Ship button + explanation), so both say the same thing.
// "unavailable": Hack Club Auth couldn't be asked; the server refuses the ship, the page doesn't block the button.
export type IdvStatus = "verified" | "needs_submission" | "pending" | "ineligible" | "unavailable"

export const IDV_SUBMIT_URL = "https://auth.hackclub.com/verifications/new"
export const IDV_DASHBOARD_URL = "https://auth.hackclub.com"

export interface IdvBlock {
	title: string
	message: string
	link?: { href: string, label: string }
}

// Why a user can't ship, or null if their status allows it
export const idvShipBlock = (status: IdvStatus): IdvBlock | null => {
	switch (status) {
		case "needs_submission":
			return {
				title: "Verify your identity to ship",
				message: `You need to complete identity verification before you can submit a project to Alchemize. Submit your ID at ${IDV_SUBMIT_URL}, then come back and ship once it's approved.`,
				link: { href: IDV_SUBMIT_URL, label: "Verify on Hack Club Auth" },
			}
		case "pending":
			return {
				title: "Verification in review",
				message: "Your identity verification is still being reviewed. You can submit a project to Alchemize once it's approved, keep working on your project in the meantime.",
				link: { href: IDV_DASHBOARD_URL, label: "Check status on Hack Club Auth" },
			}
		case "ineligible":
			return {
				title: "Not eligible",
				message: "You can't submit projects to Alchemize because your Hack Club account isn't eligible for this program. If you think this is a mistake, ask in #identity-help.",
			}
		default:
			return null
	}
}
