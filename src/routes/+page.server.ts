import { env } from "$env/dynamic/private";
import type { PageServerLoad } from "./$types";
import { deriveReferralKey, parseReferralCode } from "$lib/server/referralCode";

export const load: PageServerLoad = async ({ url, cookies }) => {
    const refer = url.searchParams.get("refer")
    if (!refer) {
        return
    }
    // Signed codes are verified here; legacy codes are only format-checked and get matched to a real user at login
    if (!parseReferralCode(refer, deriveReferralKey(env.USER_JWT_SECRET ?? ""), env.USERID_ENCRYPTION_KEY ?? "")) {
        return {
            error: "Invalid referral code."
        }
    }
    cookies.set("refer", refer, { maxAge: 60 * 60 * 24 * 10, path: "/" })
}
