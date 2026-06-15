import type { PageServerLoad } from './$types';
import type { Item, UserCurrency } from "$lib/types"
import { getUserByEmail, fetchAllItems, createShopItem } from '$lib/db';
import jwt from 'jsonwebtoken';
import {USER_JWT_SECRET} from '$env/static/private';
export const load: PageServerLoad = async ({ cookies }) => {
    
    const at = cookies.get('access_token_new');
    const userToken = cookies.get('user_token');
    
    let data: any = null;
    if (userToken) {
        try {
            data = jwt.verify(userToken, USER_JWT_SECRET);
        }
        catch (err) {
            console.error("Error verifying JWT:", err);
        }
    }
    const email = data?.email;
    const itemsResponse = await fetchAllItems();
    if (!itemsResponse.ok) {
        throw new Error("Failed to fetch items from the database");
    }
    const itemsData = await itemsResponse.json();
    console.log("Fetched items data:", JSON.stringify(itemsData, null, 2));
    const items: Item[] = itemsData.records.map((record: any) => ({
        itemID: record.id,
        name: record.fields.name,
        description: record.fields.description,
        itemPrice: record.fields.itemPrice,
        cdnImage: record.fields.cdnImage,
    }));
    
    return {
        items,
      
    }
}