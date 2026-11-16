import { PUBLIC_HACKCLUB_AUTH, PUBLIC_HACKCLUB_REDIRECT } from "$env/static/public"
import { redirect } from "@sveltejs/kit"
import { scopes } from "$lib/utils"
import type { PageServerLoad } from "./$types"
import { createOAuthState } from "$lib/server/hackClubAuth"

export const load: PageServerLoad = ({ cookies, url }) => {
	const state = createOAuthState(cookies, "oauth_state", url.protocol === "https:")
	const authorizationUrl =
		"https://auth.hackclub.com/oauth/authorize?client_id=" +
		PUBLIC_HACKCLUB_AUTH +
		"&redirect_uri=" +
		PUBLIC_HACKCLUB_REDIRECT +
		"&response_type=code&scope=" +
		scopes +
		"&state=" +
		state
	return redirect(303, authorizationUrl)
}
