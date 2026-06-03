import type { RequestHandler } from "@sveltejs/kit"
import { AIRTABLE, AIRTABLE_CLIENT, BOT_AUTH } from '$env/static/private';
import itemsJson from "./../items.json"
import looseJson from 'loose-json'
import type { Item, UserCurrency } from "$lib/types"
import { createOrder, getUserByEmail, patchUserCurrency } from "$lib/db";
interface RequestBody {
    itemId: string;
    quantity: number;
}
const getCurrency = (itemPrice: UserCurrency): keyof UserCurrency => {
    if(itemPrice.redstone>0){
        return "redstone"
    }else if(itemPrice.glowstone>0){
        return "glowstone"
    }else if(itemPrice.aqua_regia>0){
        return "aqua_regia"
    }else{
        return "potion_mix"
    }
}
const purchaseItem = (item: Item, quantity: number, userCurrency: UserCurrency): UserCurrency => {
    const currencyType = getCurrency(item.itemPrice);
    const totalCost = item.itemPrice[currencyType] * quantity;
    return { ...userCurrency, [currencyType]: userCurrency[currencyType] - totalCost };
}
export const POST: RequestHandler = async ({ request, cookies }) => {
    const body: RequestBody = await request.json();
    if(body.quantity <= 0){
        return new Response("Quantity must be greater than 0", { status: 400 })
    }
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
    const userResponse = await getUserByEmail(email);
    if (!userResponse.ok) {
        return new Response("Failed to fetch user data from Airtable", { status: 500 })
    }
    const userData = await userResponse.json();
    const userRecord = userData.records[0];
    if (!userRecord) {
        return new Response("User not found", { status: 404 })
    }
    const currentCurrency = looseJson(userRecord.fields.currency) as UserCurrency;
    const currencyUsed = getCurrency(item.itemPrice);
    const totalPrice = item.itemPrice[currencyUsed] * body.quantity;
    const hasThatCurrency = currentCurrency[currencyUsed];
    if (hasThatCurrency < totalPrice) {
        console.log(hasThatCurrency, totalPrice);
        return new Response("Insufficient currency: " + hasThatCurrency + " < " + totalPrice, { status: 400 })
    }
    const updatedCurrency = purchaseItem(item, body.quantity, currentCurrency);
    const updatedUserResponse = await patchUserCurrency(email, updatedCurrency);

    if (!updatedUserResponse.ok) {
        console.log("Failed to update user currency:", await updatedUserResponse.text());
        return new Response("Failed to update user currency", { status: 500 })
    }
    const purchaseRecord = await createOrder({
                orderItem: item.name,
                itemID: item.itemID,
                qty: body.quantity,
                ordererEmail: email,
                ordererUid: uid,
                status: "pending",
                fulfiller: "",
                moreData: ""
            })
    if (!purchaseRecord.ok) {
        console.log("Failed to create purchase record:", await purchaseRecord.text());
        return new Response("Failed to create purchase record", { status: 500 })
    }
    const botResponse = await fetch("https://aoishik.qzz.io/fulfill_pending", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${BOT_AUTH}`
        },
        body: JSON.stringify(
            { "user_id": data.identity?.slack_id, "order_id": "< _Some random ID_ >", "item_name": item.name, "qty": `${body.quantity}`, "cost": `${totalPrice} ${currencyUsed.charAt(0).toUpperCase() + currencyUsed.slice(1)}` }
        )
    })
    if (!botResponse.ok) {
        console.warn(`Failed to send notification to bot for fulfillment ${item.name}:`, {
            status: botResponse.status,
            statusText: botResponse.statusText,
            timestamp: new Date().toISOString(),
            slackId: data.identity?.slack_id,
            itemName: item.name
        })
        return new Response("Project shipped but failed to send notification", { status: 207 })
    }
    return new Response("ok")
}