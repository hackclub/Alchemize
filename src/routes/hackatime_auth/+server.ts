import { redirect, type RequestHandler } from "@sveltejs/kit"
import { PUBLIC_HACKATIME_AUTH, PUBLIC_HACKATIME_REDIRECT } from "$env/static/public"
import { createOAuthState } from "$lib/server/hackClubAuth"

// Starts the Hackatime OAuth flow with a state value that /hackatime_callback checks
export const GET: RequestHandler = async ({ cookies, locals }) => {
	if (!locals.user) {
		throw redirect(303, "/auth")
	}
	const state = createOAuthState(cookies, "hackatime_oauth_state")
	const params = new URLSearchParams({
		client_id: PUBLIC_HACKATIME_AUTH,
		redirect_uri: PUBLIC_HACKATIME_REDIRECT,
		response_type: "code",
		scope: "profile read",
		state,
	})
	throw redirect(303, `https://hackatime.hackclub.com/oauth/authorize?${params}`)
}
