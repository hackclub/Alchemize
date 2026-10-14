
import type { LayoutServerLoad } from './$types';
import {  authUrl } from '$lib/utils';
import { redirect } from '@sveltejs/kit';
import { PUBLIC_HACKATIME_AUTH, PUBLIC_HACKATIME_REDIRECT, PUBLIC_HACKCLUB_AUTH, PUBLIC_HACKCLUB_REDIRECT,PUBLIC_TURNED_OFF } from '$env/static/public';
export const load: LayoutServerLoad = async ({ cookies, locals }) => {
    //Check if any user cookies is not present/ invalid, if so make the user relogin
    if(PUBLIC_TURNED_OFF !== "false"){
        throw redirect(302, "/turned-off")
    }
    const hackatimeVerified = cookies.get('hackatime_verified');
    const hackatimeAuthUrl = `https://hackatime.hackclub.com/oauth/authorize?client_id=${PUBLIC_HACKATIME_AUTH}&redirect_uri=${encodeURIComponent(PUBLIC_HACKATIME_REDIRECT)}&response_type=code&scope=profile+read`

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