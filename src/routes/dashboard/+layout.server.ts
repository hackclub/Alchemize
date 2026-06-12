
import type { LayoutServerLoad } from './$types';
import { getDataFromAccessToken } from '$lib/utils';
import { redirect } from '@sveltejs/kit';
import { PUBLIC_HACKATIME_AUTH, PUBLIC_HACKATIME_REDIRECT, PUBLIC_HACKCLUB_AUTH, PUBLIC_HACKCLUB_REDIRECT } from '$env/static/public';
import { ALLOWED_EMAILS, USER_JWT_SECRET } from '$env/static/private';
import type {UserAuthToken} from "$lib/types"
import jwt from 'jsonwebtoken';
export const load: LayoutServerLoad = async ({ cookies }) => {
    //Check if any user cookies is not present/ invalid, if so make the user relogin
    const accessToken = cookies.get('access_token_new');
    const hackatimeToken = cookies.get('hackatime_token');
    const hackatimeVerified = cookies.get('hackatime_verified');
    const airtableUserRecordId = cookies.get('airtable_user_record_id');
    const userToken = cookies.get("user_token")
    const hackatimeAuthUrl = `https://hackatime.hackclub.com/oauth/authorize?client_id=${PUBLIC_HACKATIME_AUTH}&redirect_uri=${encodeURIComponent(PUBLIC_HACKATIME_REDIRECT)}&response_type=code&scope=profile+read`
    const authUrl = `https://auth.hackclub.com/oauth/authorize?client_id=${PUBLIC_HACKCLUB_AUTH}&response_type=code&scope=openid+profile+email+name+verification_status+slack_id&redirect_uri=${encodeURIComponent(PUBLIC_HACKCLUB_REDIRECT)}`

    if (!accessToken || !airtableUserRecordId || accessToken === "" || airtableUserRecordId === "" || !userToken || userToken === "") {
        throw redirect(302, authUrl);
        return {
            allowed: false,
            relogin: true,
            reHackatime: false,
        }
    }
    if (!hackatimeToken || !hackatimeVerified || hackatimeToken === "" || hackatimeVerified === "") {
        throw redirect(302, hackatimeAuthUrl);
        return {
            allowed: false,
            relogin: false,
            reHackatime: true,
        }
    }
    const allowedEmails = ALLOWED_EMAILS.split(',').map((email: string) => email.trim());
    let decodedToken: UserAuthToken;
    try{    
        decodedToken = jwt.verify(userToken, USER_JWT_SECRET) as UserAuthToken;
    }
    catch(err){
        console.error("Invalid access token:", err);
        throw redirect(302, authUrl);
    }
    const email = decodedToken.email;
    if (!email || !allowedEmails.includes(email)) {
        return {
            allowed: false,
            relogin: false,
            reHackatime: false,
        }
    }
    return {
        allowed: true,
        relogin: false,
        reHackatime: false,
    }

}