import {ADMIN_HACKCLUB_SECRET, AIRTABLE, AIRTABLE_CLIENT, ADMIN_JWT_SECRET} from "$env/static/private"
import { PUBLIC_ADMIN_HACKCLUB_AUTH, PUBLIC_ADMIN_HACKCLUB_REDIRECT } from "$env/static/public"
import { error, redirect } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import jwt from "jsonwebtoken"

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
}
export const GET: RequestHandler = async ({ url, cookies }) => {
    const code = url.searchParams.get("code")

    if (!code) {
        throw error(400, "Missing authorization code")
    }
    const airtableClient = AIRTABLE_CLIENT
    const airtableSecret = AIRTABLE
    const clientId = PUBLIC_ADMIN_HACKCLUB_AUTH
    const clientSecret = ADMIN_HACKCLUB_SECRET
    const redirectUri = PUBLIC_ADMIN_HACKCLUB_REDIRECT

    if (!clientId || !clientSecret || !redirectUri) {
        throw error(500, "Missing OAuth environment variables")
    }
    if (!airtableClient || !airtableSecret) {
        throw error(500, "Missing Airtable environment variables")
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
    
    const tokenBody = await tokenResponse.json()

    if (!tokenResponse.ok) {
        throw error(
            tokenResponse.status,
            tokenBody?.message ?? "Token exchange failed"
        )
    }
    const decodedToken = jwt.decode(tokenBody.id_token) as { slack_id: string, email: string, name: string } | null
    const airtableRes = await fetch(`https://api.airtable.com/v0/${airtableClient}/admins?filterByFormula={slackId}="${decodedToken?.slack_id}"`, {
        headers: {
            Authorization: `Bearer ${airtableSecret}`,
        },
    })
    if (!airtableRes.ok) {
        console.error("Failed to fetch user data from Airtable", await airtableRes.text())
        throw error(500, "Failed to fetch user data from Airtable")
    }
    const airtableData = await airtableRes.json()
    const userRecord = airtableData.records[0]
    if (!userRecord) {
        throw error(403, "Forbidden")
    }
    const fields = userRecord.fields as AirtableUser;
    const payload: TokenPayload = {
        slackId: fields.slackId,
        email: fields.email,
        name: fields.name,
        roles: fields.roles,
        isReviewer: fields.roles.split(",").includes("reviewer"),
        isSuperAdmin: fields.roles.split(",").includes("super_admin"),
        isFulfiller: fields.roles.split(",").includes("fulfiller"),
        isT2Reviewer: fields.roles.split(",").includes("t2_reviewer"),

    }
    const jwtToken = jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: "6h" })
    cookies.set("admin_access_token", tokenBody.access_token, {
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
