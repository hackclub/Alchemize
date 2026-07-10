import type { RequestHandler } from "@sveltejs/kit";
import { atomicTradeCurrency } from "$lib/db"
import { currenciesToPotionMix } from "$lib/utils"
import { USER_JWT_SECRET } from "$env/static/private";
import jwt from "jsonwebtoken";
import type { UserAuthToken } from "$lib/types";

export const POST: RequestHandler = async ({ request, cookies }) => {
    const { redstone, glowstone, aqua_regia } = await request.json();
    const isValidAmount = (v: unknown): v is number =>
        typeof v === "number" && Number.isInteger(v) && v >= 0;
    if (![redstone, glowstone, aqua_regia].every(isValidAmount)) {
        return new Response(JSON.stringify({
            error: "Invalid currency amounts"
        }), { status: 400 })
    }

    const userToken = cookies.get('user_token');
    if (!userToken) {
        return new Response(JSON.stringify({
            error: "Unauthorized"
        }), { status: 401 })
    }

    let data: UserAuthToken | null = null;
    try {
        data = jwt.verify(userToken, USER_JWT_SECRET) as UserAuthToken;
    } catch (err) {
        console.error("Error verifying JWT:", err);
        return new Response(JSON.stringify({
            error: "Invalid user token"
        }), { status: 401 })
    }

    const email = data.email;
    const slackId = data.slack_id;
    if (!email) {
        return new Response(JSON.stringify({
            error: "Unauthorized"
        }), { status: 401 })
    }

    const newPotionMix = currenciesToPotionMix(redstone, glowstone, aqua_regia);
    if (newPotionMix <= 0) {
        return new Response(JSON.stringify({
            error: "Invalid trade amounts"
        }), { status: 400 })
    }

    // Atomic trade: validates balance and updates currency in a single transaction
    const tradeResult = await atomicTradeCurrency(email, redstone, glowstone, aqua_regia, newPotionMix, slackId);

    if (!tradeResult.ok) {
        const errorData = await tradeResult.json();
        if (tradeResult.status === 400) {
            return new Response(JSON.stringify({
                error: errorData.message || "Insufficient currency"
            }), { status: 400 })
        }
        if (tradeResult.status === 404) {
            return new Response(JSON.stringify({
                error: errorData.message || "User not found"
            }), { status: 404 })
        }
        return new Response(JSON.stringify({
            error: errorData.message || "Trade failed"
        }), { status: 500 })
    }

    const tradeData = await tradeResult.json();
    return new Response(JSON.stringify({
        success: true,
        newCurrency: tradeData.newCurrency
    }), { status: 200 })
}