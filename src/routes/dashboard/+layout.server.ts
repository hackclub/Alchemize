
import type { LayoutServerLoad } from './$types';
import { authUrl, hackatimeAuthUrl } from '$lib/utils';
import { redirect } from '@sveltejs/kit';
import { PUBLIC_TURNED_OFF } from '$env/static/public';
export const load: LayoutServerLoad = async ({ cookies, locals }) => {
    //Check if any user cookies is not present/ invalid, if so make the user relogin
    if(PUBLIC_TURNED_OFF !== "false"){
        throw redirect(302, "/turned-off")
    }
    const hackatimeVerified = cookies.get('hackatime_verified');

    // Verified (signature, age, version) once per request in hooks.server.ts
    if (!locals.user) {
        throw redirect(302, authUrl);
    }
    if (!hackatimeVerified ||  hackatimeVerified === "") {
        throw redirect(302, hackatimeAuthUrl);
        return {
            allowed: false,
            relogin: false,
            reHackatime: true,
        }
    }
    return {
        allowed: true,
        relogin: false,
        reHackatime: false,
    }

}