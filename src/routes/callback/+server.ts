import { env } from "$env/dynamic/private"
import {PUBLIC_HACKCLUB_AUTH, PUBLIC_HACKCLUB_REDIRECT} from "$env/static/public"
import { hackatimeAuthUrl } from "$lib/utils"
import { error, redirect } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import type { UserAuthToken } from "$lib/types"
import { jwtDecode } from "jwt-decode"
import type { AirtableUser } from "$lib/types"
import jwt from "jsonwebtoken"
import { createNewUser, getUserByEmail, createReferRecord } from "$lib/db"
const XORdecrypt = (textInp: string) => {
	const tb = Buffer.from(textInp, "base64")
	const kb = Buffer.from(env.USERID_ENCRYPTION_KEY, "hex")
	const out = Buffer.alloc(tb.length)

	for (let i = 0; i < tb.length; i++) {
		out[i] = tb[i] ^ kb[i % kb.length]
	}
	return out.toString("utf-8")
}
/*
CLEANUP PLAN DETAILS DO NOT TOUCH:
Code FLOW:
	->Fetch the code and refer cookies
	->Exchange code for token with Hack Club(auth.hackclub.com/oauth/token)
	->Decode the OIDC Token to get user info (email, name, slack id, hack club id, verification status, ysws eligibility)
	->Check if user exists in DB by matching Emails
	->If user does not exist, create new user record in DB and store record ID
	->If refer cookie exists and user is new, create refer record in DB with decoded refer cookie (referrer email and slack id), ysws eligibility, verification status, and first name for personalization
	->Create JWT containing user info and store in HTTP-only cookie for authentication in the app
*/
export const GET: RequestHandler = async ({ url, cookies }) => {
	// All Cookies Used
	// airtable_user_record_id: Stores the Airtable record ID of the user, used for database operations
	// user_token: JWT containing user information, used for authentication and authorization in the app
	// access_token_new: The access token from Hack Club OAuth, used for making authenticated requests to Hack Club API
	// NON HTTPONLY -> hackatime_verified: A flag to indicate if the user has a verified Hackatime account, used for conditional rendering and features
	// hackatime_token: The user's Hackatime token, used for integrating Hackatime features in the app
	// slack_id: The user's Slack ID from Hack Club, used for Slack integration features in the app
	// Hackatime Token stored for 1 year
	// User Token stored for 4 months
	// Hack Club Auth tokens stored for 6 months (refresh tokens not used, so access tokens are long-lived)

	
	const code = url.searchParams.get("code")
	const referCookie = cookies.get("refer")
	
	let userHackatime = ""
	if (!code) {
		throw error(400, "Missing authorization code")
	}
	const clientId = PUBLIC_HACKCLUB_AUTH
	const clientSecret = env.HACKCLUB_SECRET
	const redirectUri = PUBLIC_HACKCLUB_REDIRECT
	let newUser = false
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

	const tokenBody = await tokenResponse.json()

	if (!tokenResponse.ok) {
		console.error("Token exchange failed:", tokenBody)
		throw error(
			tokenResponse.status,
			tokenBody?.message ?? "Token exchange failed"
		)
	}
	const decodedToken: any = jwtDecode(tokenBody.id_token)
	const email = decodedToken.email
	const name = decodedToken.name
	const slackId = decodedToken.slack_id
	const hackClubId = decodedToken.sub
	const firstName = decodedToken.nickname
	const verification = decodedToken.verification_status
	const yswsEligible = decodedToken.ysws_eligible
	let userRecordId = ""
	//Look for user in DB, if not found create new user
	const userResponse = await getUserByEmail(email)
	if (!userResponse.ok) {
		console.error("Database error:", await userResponse.text())
		return error(userResponse.status, "Database error")
	}
	let userData: AirtableUser[] = (await userResponse.json()).records
	
	if (userData.length === 0) {
		newUser = true
		const createResponse = await createNewUser(email, hackClubId, slackId)
		if (!createResponse.ok) {
			console.error("Database error:", await createResponse.text())
			return error(createResponse.status, "Database error")
		}
		userRecordId = (await createResponse.json()).id
	}else{
		
		userRecordId = userData[0].id
	}
	if (referCookie && newUser) {
		const decodedRefer = XORdecrypt(referCookie)
		//Verify format of decoded refer
		if (
			decodedRefer.split(" ").length !== 2 ||
			!decodedRefer.split(" ")[1].startsWith("U")
		) {
			throw error(400, "Invalid referral code")
		}
		const referRespone = await createReferRecord(
			email,
			decodedRefer,
			yswsEligible,
			verification,
			firstName
		)
		if (!referRespone.ok) {
			console.error("Database error:", await referRespone.text())
			return error(referRespone.status, "Database error")
		}
	}
	const userToken: UserAuthToken = {
		id: hackClubId,
		dbid: userRecordId,
		email,
		verification_status: verification,
		first_name: firstName,
		last_name: name.split(" ").slice(1).join(" "),
		slack_id: slackId,
		ysws_eligible: yswsEligible,
	}
	const jwtToken = jwt.sign(userToken, env.USER_JWT_SECRET, { expiresIn: "120d" })
	cookies.set("user_token", jwtToken, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 120, // 120 days
		path: "/",
	})
	cookies.set("airtable_user_record_id", userRecordId, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 365, // 1 year
		path: "/",
	})
	cookies.set("access_token_new", tokenBody.access_token, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 180, // 6 months
		path: "/",

	})
	cookies.set("slack_id", slackId, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 365, // 1 year
		path: "/",
	})
	if(userData.length > 0 && userData[0].fields.hackatime){
		
		cookies.set("hackatime_verified", "true", {
			httpOnly: false,
			secure: true,
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 365, // 1 year
			path: "/",
		})
	}else{
		throw redirect(303, hackatimeAuthUrl)
	}
	throw redirect(303, "/dashboard")
}
