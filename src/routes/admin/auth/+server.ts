import { redirect, type RequestHandler } from "@sveltejs/kit"
import { PUBLIC_ADMIN_HACKCLUB_AUTH, PUBLIC_ADMIN_HACKCLUB_REDIRECT } from "$env/static/public"
import { createOAuthState } from "$lib/server/hackClubAuth"

// Starts the admin Hack Club Auth flow with a state value that /admin/callback checks
export const GET: RequestHandler = async ({ cookies }) => {
	const state = createOAuthState(cookies, "admin_oauth_state")
	const params = new URLSearchParams({
		client_id: PUBLIC_ADMIN_HACKCLUB_AUTH,
		response_type: "code",
		scope: "openid profile email name verification_status slack_id",
		redirect_uri: PUBLIC_ADMIN_HACKCLUB_REDIRECT,
		state,
	})
	throw redirect(303, `https://auth.hackclub.com/oauth/authorize?${params}`)
}
