import type { RequestHandler } from "@sveltejs/kit";
import { getUserByEmail, patchUserCurrency } from "$lib/db"
import type { UserCurrency } from "$lib/types";
import looseJson from "loose-json"
import {currenciesToPotionMix} from "$lib/utils"
export const POST: RequestHandler = async ({ request, cookies }) => {
    const at = cookies.get('access_token_new');
    const { redstone, glowstone, aqua_regia } = await request.json();

    const fetchRes = await fetch("https://auth.hackclub.com/api/v1/me", {
        headers: {
            Authorization: `Bearer ${at}`,
        },
        method: "GET"
    })

    const userData = await fetchRes.json()
    if (!fetchRes.ok) {
        return new Response(JSON.stringify({
            error: userData?.message ?? "Failed to fetch user data"
        }), { status: 500 })
    }
    const userResponse = await getUserByEmail(userData.identity.primary_email);
    const userData2 = await userResponse.json();
    const user = userData2.records[0].fields
    const userCurrencies = user.currency ? looseJson(user.currency) : {} as UserCurrency;
    const newPotionMix = currenciesToPotionMix(redstone, glowstone, aqua_regia);
    const newCurrency = {
        redstone: (userCurrencies.redstone ?? 0) - redstone,
        glowstone: (userCurrencies.glowstone ?? 0) - glowstone,
        aqua_regia: (userCurrencies.aqua_regia ?? 0) - aqua_regia,
        potion_mix: userCurrencies.potion_mix + newPotionMix,
    }
    const patchRes = await patchUserCurrency(userData.identity.primary_email, newCurrency)
    if (!patchRes.ok) {
        const errorData = await patchRes.json()
        return new Response(JSON.stringify({
            error: errorData?.message ?? "Failed to update user currency"
        }), { status: 500 })
    }

    return new Response(JSON.stringify({
        success: true,
        newCurrency: newCurrency
    }), { status: 200 })

}