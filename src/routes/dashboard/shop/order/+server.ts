import type { RequestHandler } from "@sveltejs/kit"
import { BOT_AUTH, USER_JWT_SECRET } from '$env/static/private';
import type { Item, UserCurrency } from "$lib/types"
import { atomicPurchaseItem, getShopItemById } from "$lib/db";
import jwt from 'jsonwebtoken';
import type {UserAuthToken} from "$lib/types";
import { getDataFromAccessToken } from "$lib/utils";
import crypto from "crypto";
import { encryptAES } from "$lib/utils.server";

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
export const POST: RequestHandler = async ({ request, cookies }) => {
    const body: RequestBody = await request.json();
    if(body.quantity <= 0){
        return new Response("Quantity must be greater than 0", { status: 400 })
    }
    const accessToken = cookies.get('access_token_new');
    if (!accessToken) {
        return new Response("Unauthorized", { status: 401 })
    }
    const [itemResponse] = await Promise.all([getShopItemById(body.itemId)]);
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
    const currencyUsed = getCurrency(item.itemPrice);
    const totalPrice = item.itemPrice[currencyUsed] * body.quantity;


    
    // Atomic purchase: deducts currency and creates order in a single transaction
    const purchaseResult = await atomicPurchaseItem(
        email,
        currencyUsed,
        totalPrice,
        body.quantity,
        item.name,
        item.itemID,
        uid,
        data?.slack_id ?? "",
        ""
    );

    if (!purchaseResult.ok) {
        const errorText = await purchaseResult.text();
        if (purchaseResult.status === 400) {
            return new Response(errorText, { status: 400 });
        }
        if (purchaseResult.status === 404) {
            return new Response(errorText, { status: 404 });
        }
        return new Response(errorText, { status: 500 });
    }

    const purchaseData = await purchaseResult.json();
    const botResponse = await fetch("https://notifications.alchemize.hackclub.com/fulfill_pending", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${BOT_AUTH}`
        },
        body: JSON.stringify(
            { "user_id": data?.slack_id, "order_id": purchaseData.orderId, "item_name": item.name, "qty": `${body.quantity}`, "cost": `${totalPrice} ${currencyUsed.charAt(0).toUpperCase() + currencyUsed.slice(1)}` }
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
        return new Response("Order placed but failed to send notification", { status: 207 })
    }
    return new Response("ok")
}