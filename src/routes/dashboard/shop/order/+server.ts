import type { RequestHandler } from "@sveltejs/kit"
import { BOT_AUTH, USER_JWT_SECRET } from '$env/static/private';
import looseJson from 'loose-json'
import type { Item, UserCurrency } from "$lib/types"
import { createOrder, getUserByEmail, patchUserCurrency, getShopItemById } from "$lib/db";
import jwt from 'jsonwebtoken';
import type {UserAuthToken} from "$lib/types";
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
    const itemResponse = await getShopItemById(body.itemId);
    if (!itemResponse.ok) {
        return new Response("Failed to fetch item from the database", { status: 500 })
    }
    const itemsData = await itemResponse.json();
    const itemRecord = itemsData;
    const item: Item = {
        itemID: itemRecord.id,
        name: itemRecord.fields.name,
        description: itemRecord.fields.description,
        itemPrice: itemRecord.fields.itemPrice,
        cdnImage: itemRecord.fields.cdnImage,
    }
    const userToken = cookies.get('user_token');
    if (!item) {
        return new Response("Item not found", { status: 404 })
    }
    const at = cookies.get('access_token_new');
    if (!at) {
        return new Response("Unauthorized", { status: 401 })
    }
    let data: UserAuthToken | null = null;
    if (userToken) {
        try {
            data = jwt.verify(userToken, USER_JWT_SECRET) as UserAuthToken;
        }
        catch (err) {
            console.error("Error verifying JWT:", err);
        }
    }
    const uid = data?.id;
    const email = data?.email;
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
    const [updatedUserResponse, purchaseRecord] = await Promise.all([
        patchUserCurrency(email, updatedCurrency),
        createOrder({
                orderItem: item.name,
                itemID: item.itemID,
                qty: body.quantity,
                ordererEmail: email,
                ordererUid: uid,
                status: "pending",
                fulfiller: "",
                moreData: ""
            })

    ])

    if (!updatedUserResponse.ok) {
        console.log("Failed to update user currency:", await updatedUserResponse.text());
        return new Response("Failed to update user currency", { status: 500 })
    }

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
            { "user_id": data?.slack_id, "order_id": "< _Some random ID_ >", "item_name": item.name, "qty": `${body.quantity}`, "cost": `${totalPrice} ${currencyUsed.charAt(0).toUpperCase() + currencyUsed.slice(1)}` }
        )
    })
    if (!botResponse.ok) {
        console.warn(`Failed to send notification to bot for fulfillment ${item.name}:`, {
            status: botResponse.status,
            statusText: botResponse.statusText,
            timestamp: new Date().toISOString(),
            slackId: data?.slack_id,
            itemName: item.name
        })
        return new Response("Project shipped but failed to send notification", { status: 207 })
    }
    return new Response("ok")
}