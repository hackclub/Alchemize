import type { PageServerLoad } from "./$types"
import { fetchAllItems, toShopItem, type airtableReplication } from "$lib/db"

export const load: PageServerLoad = async () => {
	const { records } = await (await fetchAllItems()).json()

	return {
		items: (records as airtableReplication[]).map(toShopItem),
	}
}
