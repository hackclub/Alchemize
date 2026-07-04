import type { PageServerLoad } from "./$types";
import type { Item } from "$lib/types";
import { fetchAllItems } from "$lib/db";

export const load: PageServerLoad = async () => {
    const itemsResponse = await fetchAllItems();

    if (!itemsResponse.ok) {
        throw new Error("Failed to fetch items from the database");
    }

    const itemsData = await itemsResponse.json();

    const items: Item[] = itemsData.records.map((record: any) => ({
        itemID: record.id,
        name: record.fields.name,
        description: record.fields.description,
        itemPrice: record.fields.itemPrice,
        cdnImage: record.fields.cdnImage,
    }));

    return {
        items,
        userRecord: {
            id: "",
            fields: {
                email: "",
                slackId: "",
                currency: '{"redstone":0,"glowstone":0,"aqua_regia":0,"potion_mix":0}'
            }
        }
    };
};