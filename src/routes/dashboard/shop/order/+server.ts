import type { RequestHandler } from "@sveltejs/kit"
import { AIRTABLE, AIRTABLE_CLIENT } from '$env/static/private';
import itemsJson from "./../items.json"
import looseJson from 'loose-json'
interface RequestBody {
    itemId: string;
    quantity: number;
}
interface Item {
    itemID: string;
    name: string;
    description: string;
    cdnImage: string;
    itemPrice: number;
}
	interface UserCurrency {
		redstone: number
		glowstone: number
		aqua_regia: number
		potion_mix: number
	}
export const POST: RequestHandler = async ({ request, cookies }) => {
    const body: RequestBody = await request.json();
    const items: Item[] = itemsJson as Item[];
    const item = items.find(i => i.itemID === body.itemId);
    if (!item) {
        return new Response("Item not found", { status: 404 })
    }
    const at = cookies.get('access_token_new');
    if (!at) {
        return new Response("Unauthorized", { status: 401 })
    }
    const fetchRes = await fetch("https://auth.hackclub.com/api/v1/me", {
        headers: { 
            Authorization: `Bearer ${at}`,
        },
        method: "GET" 
    })
    if (!fetchRes.ok) {
        return new Response("Failed to fetch user data", { status: 500 })
    }
    const data = await fetchRes.json()
    const uid = data?.identity?.id;
    const email = data?.identity?.primary_email;
    if (!uid || !email) {
        return new Response("Unauthorized", { status: 401 })
    }
    const userResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_CLIENT}/Users?filterByFormula={userid}="${uid}"`, {
        headers: {
            Authorization: `Bearer ${AIRTABLE}`,
            "Content-Type": 'application/json'
        }
    });
    if (!userResponse.ok) {
        return new Response("Failed to fetch user data from Airtable", { status: 500 })
    }
    const userData = await userResponse.json();
    const userRecord = userData.records[0];
    if (!userRecord) {
        return new Response("User not found", { status: 404 })
    }
    const currentCurrency = looseJson(userRecord.fields.currency) as UserCurrency;
    const potionMix = currentCurrency.potion_mix || 0;
    console.log("Potion mix:", currentCurrency.potion_mix);
    const totalPrice = item.itemPrice * body.quantity;
    if (potionMix < totalPrice) {
        console.log(potionMix, totalPrice);
        return new Response("Insufficient currency: " + potionMix + " < " + totalPrice, { status: 400 })
    }
    const updatedCurrency = potionMix - totalPrice;
    const updatedUserResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_CLIENT}/Users/${userRecord.id}`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${AIRTABLE}`,
            "Content-Type": 'application/json'
        },
        body: JSON.stringify({
            fields: {
                "currency": JSON.stringify({ ...currentCurrency, potion_mix: updatedCurrency })
            }
        })
    });
    if (!updatedUserResponse.ok) {
        console.log("Failed to update user currency:", await updatedUserResponse.text());
        return new Response("Failed to update user currency", { status: 500 })
    }
    const purchaseRecord = await fetch(`https://api.airtable.com/v0/${AIRTABLE_CLIENT}/orders`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${AIRTABLE}`,
            "Content-Type": 'application/json'
        },
        body: JSON.stringify({
            fields: {
                orderItem: item.name,
                itemID: item.itemID,
                qty: body.quantity,
                ordererEmail: email,
                ordererUid: uid,
                status: "pending",
                fullfiller: "",
                moreData: ""
            }
        })
    });
    if (!purchaseRecord.ok) {
        console.log("Failed to create purchase record:", await purchaseRecord.text());
        return new Response("Failed to create purchase record", { status: 500 })
    }
    return new Response("ok")
}