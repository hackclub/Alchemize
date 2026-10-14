import { env } from "$env/dynamic/private"
import { PUBLIC_HACKCLUB_AUTH, PUBLIC_HACKCLUB_REDIRECT } from "$env/static/public"
import { hackatimeAuthUrl, getDataFromAccessToken } from "$lib/utils"
import { error, redirect } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import type { UserAuthToken } from "$lib/types"
import { encryptAES } from "$lib/utils.server"
import { signUserToken, USER_SESSION_MAX_AGE_SECONDS } from "$lib/server/auth"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { resolveAccountForLogin, createReferRecord, addUserToAuthTable, type LoginAccount } from "$lib/db"
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
	// user_token: JWT containing user information, used for authentication and authorization in the app
	//   (verified once per request in hooks.server.ts, valid for 30 days)
	// hackatime_verified:  flag indicating the user has a verified Hackatime account, read server-side only
	// slack_id: The user's Slack ID from Hack Club, used for Slack integration features in the app
	// The Hack Club Auth access token is only used during this request and never stored


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


	const state = url.searchParams.get("state")
	const storedState = cookies.get("oauth_state")
	if (!state || !storedState || state !== storedState) {
		cookies.delete("oauth_state", { path: "/" })
		throw error(400, "Invalid state parameter")
	}
	cookies.delete("oauth_state", { path: "/" })

	const [tokenResponse, keysResponse] = await Promise.all([fetch("https://auth.hackclub.com/oauth/token", {
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
	}),
	fetch("https://auth.hackclub.com/oauth/discovery/keys")])

	const [tokenBody, keysBody] = await Promise.all([tokenResponse.json(), keysResponse.json()])
	const jwk = keysBody.keys[0]
	const publicKey = crypto.createPublicKey({
		key: jwk,
		format: "jwk",
	})
	if (!tokenResponse.ok) {
		console.error("Token exchange failed:", tokenBody)
		throw error(
			tokenResponse.status,
			tokenBody?.message ?? "Token exchange failed"
		)
	}
	const meResponse = await getDataFromAccessToken(tokenBody.access_token)

	const decodedToken: any = jwt.verify(tokenBody.id_token, publicKey, { algorithms: ["RS256"] })
	const email = decodedToken.email
	const name = decodedToken.name
	const slackId = decodedToken.slack_id
	const hackClubId = decodedToken.sub
	const firstName = decodedToken.nickname
	const verification = decodedToken.verification_status
	const yswsEligible = decodedToken.ysws_eligible
	// Each field is encrypted with its own IV embedded in the ciphertext, so no
	// shared record-level IV is needed. The legacy `iv` column is kept as "" for
	// schema/backward-compat; decryption reads the per-field IV from the payload.
	const iv = ""
	let encryptedAddress = "null"
	if (meResponse.address && meResponse.address.length > 0) {
		encryptedAddress = encryptAES(JSON.stringify(meResponse.address)).finalString

	}
	const encryptedBirthdate = encryptAES(meResponse.birthday).finalString
	const encryptedFirstName = encryptAES(name.split(" ")[0]).finalString
	const encryptedLastName = encryptAES(name.split(" ").at(-1)).finalString
	// Find the account by Hack Club Auth id (falling back to email), creating it on first login.
	// account.email is the account key used everywhere else; it follows email changes on Hack Club Auth.
	let account: LoginAccount
	try {
		account = await resolveAccountForLogin(hackClubId, email, slackId)
	} catch (err) {
		console.error("Database error while resolving the account:", err)
		return error(500, "Database error")
	}
	await addUserToAuthTable(account.email, encryptedAddress, encryptedBirthdate, encryptedFirstName, encryptedLastName, iv, hackClubId)
	newUser = account.isNew
	const userRecordId = String(account.id)
	if (referCookie && newUser) {
		const decodedRefer = XORdecrypt(referCookie)
		const [referrerId, referrerSlackId] = decodedRefer.split(" ")
		// A bad referral code is ignored: the account already exists at this point,
		// so failing here would only lock the new user out of their first login
		if (decodedRefer.split(" ").length === 2 && referrerId && referrerSlackId?.startsWith("U")) {
			const referRespone = await createReferRecord(
				account.email,
				decodedRefer,
				yswsEligible,
				verification,
				firstName
			)
			if (!referRespone.ok) {
				console.error("Database error:", await referRespone.text())
				return error(referRespone.status, "Database error")
			}
		} else {
			console.warn("Ignoring malformed referral cookie for a new user")
		}
	}
	if (referCookie) {
		cookies.delete("refer", { path: "/" })
	}
	const userToken: UserAuthToken = {
		id: hackClubId,
		dbid: userRecordId,
		email: account.email,
		verification_status: verification,
		first_name: firstName,
		last_name: name.split(" ").slice(1).join(" "),
		slack_id: slackId,
		ysws_eligible: yswsEligible,
		version: 3,
	}
	const jwtToken = signUserToken(userToken)
	cookies.set("user_token", jwtToken, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		maxAge: USER_SESSION_MAX_AGE_SECONDS,
		path: "/",
	})
	cookies.set("slack_id", slackId, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 365, // 1 year
		path: "/",
	})
	if (account.hasHackatime) {

		cookies.set("hackatime_verified", "true", {
			httpOnly: false,
			secure: true,
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 365, // 1 year
			path: "/",
		})
	} else {
		throw redirect(303, hackatimeAuthUrl)
	}
	throw redirect(303, "/dashboard")
}
