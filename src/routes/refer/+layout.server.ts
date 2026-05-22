
import type { LayoutServerLoad } from './$types';

import { redirect } from '@sveltejs/kit';
import { PUBLIC_HACKATIME_AUTH, PUBLIC_HACKATIME_REDIRECT, PUBLIC_HACKCLUB_AUTH, PUBLIC_HACKCLUB_REDIRECT } from '$env/static/public';
import {ALLOWED_EMAILS} from '$env/static/private';
export const load: LayoutServerLoad = async ({ cookies }) => {
    //Check if any user cookies is not present/ invalid, if so make the user relogin
    const accessToken = cookies.get('access_token_new');

    const airtableUserRecordId = cookies.get('airtable_user_record_id');
    
    const authUrl = `https://auth.hackclub.com/oauth/authorize?client_id=${PUBLIC_HACKCLUB_AUTH}&response_type=code&scope=openid+profile+email+name+verification_status+slack_id&redirect_uri=${encodeURIComponent(PUBLIC_HACKCLUB_REDIRECT)}`

    if (!accessToken || !airtableUserRecordId || accessToken === "" || airtableUserRecordId === "") {
        throw redirect(302, authUrl);
        return{
            allowed:false,
            relogin:true,
            reHackatime:false,
        }
    }



    return {
        allowed: true,
        relogin: false,
        reHackatime: false,
    }
}