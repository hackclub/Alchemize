import type { PageServerLoad } from './$types';
import type { Item } from "$lib/types"
import { getUserByEmail, fetchAllItems, getOrdersByEmail} from '$lib/db';
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
    const [userResponse, ordersResponse, itemsResponse] = await Promise.all([getUserByEmail(email), getOrdersByEmail(email), fetchAllItems()]);
    if (!itemsResponse.ok) {
        throw new Error("Failed to fetch items from the database");
    }
    const itemsData = await itemsResponse.json();
    const items: Item[] = itemsData.records.map((record: any) => ({
        itemID: record.id,
        name: record.fields.name,
        description: record.fields.description,
        priceHundredths: record.fields.priceHundredths,
        cdnImage: record.fields.cdnImage,
    }));
    
    const ordersData = await ordersResponse.json();
    const userData = await userResponse.json();
    const userRecord = userData.records[0];
    const formatedUserRecord = {
        id: userRecord.id,
        fields: {
            email: userRecord.fields.email,
            slackId: userRecord.fields.slackId,
            balanceHundredths: userRecord.fields.balanceHundredths,
        }
    }
    return {
        items,
        userRecord: formatedUserRecord,
        orders: ordersData.records
    }
}