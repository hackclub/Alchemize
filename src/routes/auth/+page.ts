import {PUBLIC_HACKCLUB_AUTH, PUBLIC_HACKCLUB_REDIRECT} from "$env/static/public"
import { redirect } from "@sveltejs/kit"
import {scopes} from "$lib/utils"
export const load = () => {
    const url = "https://auth.hackclub.com/oauth/authorize?client_id=" + PUBLIC_HACKCLUB_AUTH + "&redirect_uri=" + PUBLIC_HACKCLUB_REDIRECT + "&response_type=code&scope=" + scopes
    return redirect(308, url)
}