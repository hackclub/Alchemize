import type { RequestHandler } from "@sveltejs/kit"
import { BOT_AUTH, USER_JWT_SECRET } from '$env/static/private';
import type { Item } from "$lib/types"
import { formatAqua, MAX_HUNDREDTHS } from "$lib/currency"
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
export const POST: RequestHandler = async ({ request, cookies }) => {
    const body: RequestBody = await request.json();
    if (typeof body.quantity !== "number" || !Number.isInteger(body.quantity) || body.quantity <= 0) {
        return new Response("Quantity must be a positive integer", { status: 400 })
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
        priceHundredths: itemRecord.fields.priceHundredths,
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
    // Price comes only from the DB; an unpriced item must never be purchasable for free
    if (!Number.isSafeInteger(item.priceHundredths) || item.priceHundredths <= 0) {
        return new Response("Item is not available for purchase", { status: 400 })
    }
    const totalPrice = item.priceHundredths * body.quantity;
    if (!Number.isSafeInteger(totalPrice) || totalPrice > MAX_HUNDREDTHS) {
        return new Response("Quantity too large", { status: 400 })
    }


    
    // Atomic purchase: deducts currency and creates order in a single transaction
    const purchaseResult = await atomicPurchaseItem(
        email,
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
            { "user_id": data?.slack_id, "order_id": purchaseData.orderId, "item_name": item.name, "qty": `${body.quantity}`, "cost": formatAqua(totalPrice) }
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