import type { PageServerLoad } from "./$types"
import type { Item } from "$lib/types"
import { error, redirect } from "@sveltejs/kit"
import { getUserByEmail, fetchAllItems, getOrdersByEmail, toShopItem } from "$lib/db"
import { requireUserPage } from "$lib/server/auth"
export const load: PageServerLoad = async ({ locals }) => {
	const email = requireUserPage(locals).email
	const [userResponse, ordersResponse, itemsResponse] = await Promise.all([
		getUserByEmail(email),
		getOrdersByEmail(email),
		fetchAllItems(),
	])
	if (!itemsResponse.ok || !userResponse.ok) {
		throw error(503, "The shop is unavailable right now, please try again in a few minutes")
	}
	const itemsData = await itemsResponse.json()
	const items: Item[] = itemsData.records.map(toShopItem)

	const userData = await userResponse.json()
	const userRecord = userData.records?.[0]
	if (!userRecord) {
		// Same as the dashboard: a session without an account row goes back to the start
		throw redirect(303, "/")
	}
	const formatedUserRecord = {
		id: userRecord.id,
		fields: {
			email: userRecord.fields.email,
			slackId: userRecord.fields.slackId,
			balanceHundredths: userRecord.fields.balanceHundredths,
		},
	}
	// Orders are secondary: if they can't be read the shop still opens, and the orders dialog says so
	const orders = ordersResponse.ok ? (await ordersResponse.json()).records : []
	return {
		items,
		userRecord: formatedUserRecord,
		orders,
		ordersUnavailable: !ordersResponse.ok,
	}
}
