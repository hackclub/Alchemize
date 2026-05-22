import { env } from "$env/dynamic/private"
import { error, redirect } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { jwtDecode } from "jwt-decode"

const XORdecrypt = (textInp: string) => {
	const tb = Buffer.from(textInp, 'base64');
	const kb = Buffer.from(env.USERID_ENCRYPTION_KEY, "hex");
	const out = Buffer.alloc(tb.length)

	for (let i = 0; i < tb.length; i++) {
		out[i] = tb[i] ^ kb[i % kb.length]
	}
	return out.toString('utf-8');
}
export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get("code")
	const referCookie = cookies.get("refer")

	let userHackatime = ""
	if (!code) {
		throw error(400, "Missing authorization code")
	}
	const airtableClient = env.AIRTABLE_CLIENT
	const airtableSecret = env.AIRTABLE
	const clientId = env.HACKCLUB_AUTH
	const clientSecret = env.HACKCLUB_SECRET
	const redirectUri = env.HACKCLUB_REDIRECT

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
	const airtableUserRecordId = cookies.get("airtable_user_record_id")
	if (!airtableUserRecordId) {
		//Check Database for user with email fro tokenBody.id_token, if not found, create new user and set cookie with new record id, if found, set cookie with existing record id
		const decodedToken: any = jwtDecode(tokenBody.id_token)
		const email = decodedToken?.email
		if (!email) {
			throw error(400, "Email not found in ID token")
		}
		const airtableResponse = await fetch(
			`https://api.airtable.com/v0/${airtableClient}/Users?filterByFormula={email}="${encodeURIComponent(email)}"`,
			{
				headers: {
					Authorization: `Bearer ${airtableSecret}`,
				},
			}
		)
		const airtableData = await airtableResponse.json()
		if (!airtableResponse.ok) {
			throw error(
				airtableResponse.status,
				airtableData?.message ?? "Failed to fetch user from Airtable"
			)
		}
		let userRecordId: string
		if (airtableData.records.length === 0) {
			// Create new user
			const createResponse = await fetch(
				`https://api.airtable.com/v0/${airtableClient}/Users`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${airtableSecret}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						fields: {
							userid: decodedToken.sub,
							email: decodedToken.email,
							hackatime: "",
							currency: `{
							"redstone": 0,
							"glowstone": 0,
							"aqua_regia": 0,
							"potion_mix": 0,
						}`,
						},
					}),
				}
			)
			const createData = await createResponse.json()
			if (!createResponse.ok) {
				console.log(createData)
				throw error(
					createResponse.status,
					createData?.message ?? "Failed to create user in Airtable"
				)
			}
			userRecordId = createData.id

			if (referCookie) {
				const getMeResponse = await fetch("https://auth.hackclub.com/api/v1/me", {
					headers: {
						Authorization: `Bearer ${tokenBody.access_token}`,
					},
				})
				if (!getMeResponse.ok) {
					const errorData = await getMeResponse.json()
					console.log(errorData)
					console.warn("Failed to fetch user info from Hack Club API, but user was created successfully")
				}
				const meData = await getMeResponse.json()
				const verification_status = meData?.identity?.verification_status
				const ysws_eligible = meData?.identity?.ysws_eligible
				if (ysws_eligible) {
					const referer = XORdecrypt(referCookie)
					const createReferRecordResponse = await fetch(
						`https://api.airtable.com/v0/${airtableClient}/refers`,
						{
							method: "POST",
							headers: {
								Authorization: `Bearer ${airtableSecret}`,
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								fields: {
									referedEmail: decodedToken.email,
									referer: referer,
									yswsEligible: "true",
									verified: verification_status,
									referedName: meData?.identity?.first_name ?? "Unknown",
								},
							}),
						}
					)
					if (!createReferRecordResponse.ok) {
						const createReferRecordData = await createReferRecordResponse.json()
						console.log(createReferRecordData)
						console.warn("Failed to create refer record in Airtable, but user was created successfully")
					}
				}
				cookies.delete("refer", { path: "/" })
			}
		} else {
			userRecordId = airtableData.records[0].id
			userHackatime = airtableData.records[0].fields.hackatime
			if (!userHackatime) {
				userHackatime = ""
			}
		}
		cookies.set("airtable_user_record_id", userRecordId, {
			httpOnly: true,
			secure: true,
			sameSite: "lax",
			path: "/",
		})
	}
	const extraInfoData = await fetch("https://auth.hackclub.com/api/v1/me", {
		headers: {
			Authorization: `Bearer ${tokenBody.access_token}`,
		},
	})
	const extraInfo = await extraInfoData.json()
	if (!extraInfoData.ok) {
		throw error(
			extraInfoData.status,
			extraInfo?.message ?? "Failed to fetch extra user info"
		)
	}
	console.log(extraInfo)
	if (extraInfo?.identity.slack_id) {
		cookies.set("slack_id", extraInfo.identity.slack_id, {
			httpOnly: false,
			secure: true,
			sameSite: "lax",
			path: "/",
			maxAge: 60 * 60 * 24 * 30 * 6,
		})
	}
	cookies.set("access_token_new", tokenBody.access_token, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 60 * 24 * 30 * 6,
	})


	cookies.set("hackatime_verified", "true", {
		httpOnly: false,
		secure: true,
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 60 * 24 * 30 * 12,
	})
	cookies.set("hackatime_token", userHackatime, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 60 * 24 * 30 * 12,
	})
	throw redirect(303, "https://rsvp.hackclub.community/alchemize-ysws")
}
