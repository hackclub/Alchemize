import { ADMIN_HACKCLUB_SECRET, ADMIN_JWT_SECRET } from "$env/static/private"
import { PUBLIC_ADMIN_HACKCLUB_AUTH, PUBLIC_ADMIN_HACKCLUB_REDIRECT } from "$env/static/public"
import { error, redirect } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import jwt from "jsonwebtoken"
import { doesAdminExist } from "$lib/db"
import { SLACK_USER_ID_PATTERN, parseRoles } from "$lib/roles"
import { consumeOAuthState, verifyHackClubIdToken } from "$lib/server/hackClubAuth"

interface AirtableUser {
    slackId: string;
    email: string;
    name: string;
    roles: string;
}
interface TokenPayload extends AirtableUser {
    isReviewer: boolean;
    isSuperAdmin: boolean;
    isFulfiller: boolean;
    isT2Reviewer: boolean;
    isShopManager: boolean;
}
export const GET: RequestHandler = async ({ url, cookies }) => {
    const code = url.searchParams.get("code")

    if (!code) {
        throw redirect(302, "/admin/error?code=missing_code");
    }
    // Only accept a code from a login this browser started at /admin/auth
    if (!consumeOAuthState(cookies, "admin_oauth_state", url.searchParams.get("state"))) {
        throw redirect(303, "/admin/error?code=invalid_state");
    }

    const clientId = PUBLIC_ADMIN_HACKCLUB_AUTH
    const clientSecret = ADMIN_HACKCLUB_SECRET
    const redirectUri = PUBLIC_ADMIN_HACKCLUB_REDIRECT

    if (!clientId || !clientSecret || !redirectUri) {
        throw error(500, "Missing OAuth environment variables")
    }


    const tokenResponse = await fetch("https://auth.hackclub.com/oauth/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            code,
            grant_type: "authorization_code",
        }),
    })
    const tokenBody = await tokenResponse.json().catch(() => null)

    if (!tokenResponse.ok) {
        console.error("Admin token exchange failed:", tokenResponse.status, tokenBody?.message)
        throw redirect(303, "/admin/error?code=token_exchange_failed");
    }
    // Signature (key chosen by kid), issuer, audience (the admin OAuth client) and expiry are all checked
    // before any claim is trusted
    let decodedToken: { slack_id: string, email: string, name: string } | null
    try {
        decodedToken = await verifyHackClubIdToken<{ slack_id: string, email: string, name: string }>(tokenBody?.id_token, clientId)
    } catch (err) {
        console.error("Admin ID token verification failed:", err)
        throw redirect(303, "/admin/error?code=invalid_identity")
    }
    // Admins are matched by Slack ID, so an identity without one must never reach the lookup:
    // falling back to "" would match any admin row whose slackId was left empty
    const slackId = decodedToken?.slack_id
    if (typeof slackId !== "string" || !SLACK_USER_ID_PATTERN.test(slackId)) {
        throw redirect(303, "/admin/error?code=no_slack")
    }
    const airtableRes = await doesAdminExist(slackId)
    if (!airtableRes.ok) {
        console.error("Failed to fetch user data from Airtable", await airtableRes.text())
        throw error(500, "Failed to fetch user data from Airtable")
    }
    const airtableData = await airtableRes.json()
    const userRecord = airtableData.records[0]
    if (!userRecord) {
        throw redirect(303, "/admin/error?code=not_admin")
    }
    const fields = userRecord.fields as AirtableUser;
    const roles = parseRoles(fields.roles)
    const payload: TokenPayload = {
        slackId: fields.slackId,
        email: fields.email,
        name: fields.name,
        roles: fields.roles,
        isReviewer: roles.has("reviewer"),
        isSuperAdmin: roles.has("super_admin"),
        isFulfiller: roles.has("fulfiller"),
        isT2Reviewer: roles.has("t2_reviewer"),
        isShopManager: roles.has("shop_manager"),
    }
    const jwtToken = jwt.sign(payload, ADMIN_JWT_SECRET, { algorithm: "HS256", expiresIn: "6h" })
    // Only a presence flag (used to show the admin link on the dashboard); the real Hack Club Auth
    // access token is never needed after login, so it is not kept in a cookie
    cookies.set("admin_access_token", "1", {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30 * 6,
    })
    cookies.set("admin_jwt", jwtToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 1, // JWT Expires in 6 hours, but set cookie to expire in 1 hour to force revalidation
    })

    throw redirect(303, "/admin")
}
