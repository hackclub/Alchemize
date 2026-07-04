import type { PageServerLoad } from "./$types";
import { fetchAllItems } from "$lib/db";

export const load: PageServerLoad = async () => {
    const { records } = await (await fetchAllItems()).json();

    return {
        items: records.map((record: any) => ({
            itemID: record.id,
            name: record.fields.name,
            description: record.fields.description,
            itemPrice: record.fields.itemPrice,
            cdnImage: record.fields.cdnImage,
        })),
    };
};