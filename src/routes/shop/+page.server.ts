import type { PageServerLoad } from "./$types"
import { fetchAllItems, type airtableReplication } from "$lib/db"

export const load: PageServerLoad = async () => {
	const { records } = await (await fetchAllItems()).json()

	return {
		items: records.map((record: airtableReplication) => ({
			itemID: record.id,
			name: record.fields.name,
			description: record.fields.description,
			priceHundredths: record.fields.priceHundredths,
			cdnImage: record.fields.cdnImage,
		})),
	}
}
