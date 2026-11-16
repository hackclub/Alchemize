import type { RequestHandler } from "./$types"
import { fetchAllItems } from "$lib/db"

export const GET: RequestHandler = async () => {
	const { records } = await (await fetchAllItems()).json()

	return Response.json(
		records.map((record: { id: string; fields: { name: string; cdnImage: string } }) => ({
			itemID: record.id,
			name: record.fields.name,
			cdnImage: record.fields.cdnImage,
		}))
	)
}
