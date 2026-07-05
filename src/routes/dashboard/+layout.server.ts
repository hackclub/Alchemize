
import type { LayoutServerLoad } from './$types';
import {  authUrl } from '$lib/utils';
import { redirect } from '@sveltejs/kit';
import { PUBLIC_HACKATIME_AUTH, PUBLIC_HACKATIME_REDIRECT, PUBLIC_HACKCLUB_AUTH, PUBLIC_HACKCLUB_REDIRECT,PUBLIC_TURNED_OFF } from '$env/static/public';
import { ALLOWED_EMAILS, USER_JWT_SECRET } from '$env/static/private';
import type {UserAuthToken} from "$lib/types"
import jwt from 'jsonwebtoken';
export const load: LayoutServerLoad = async ({ cookies }) => {
    //Check if any user cookies is not present/ invalid, if so make the user relogin
    if(PUBLIC_TURNED_OFF !== "false"){
        throw redirect(302, "/turned-off")
    }
    const accessToken = cookies.get('access_token_new');
    const hackatimeToken = cookies.get('hackatime_token');
    const hackatimeVerified = cookies.get('hackatime_verified');
    const airtableUserRecordId = cookies.get('airtable_user_record_id');
    const userToken = cookies.get("user_token")
    const hackatimeAuthUrl = `https://hackatime.hackclub.com/oauth/authorize?client_id=${PUBLIC_HACKATIME_AUTH}&redirect_uri=${encodeURIComponent(PUBLIC_HACKATIME_REDIRECT)}&response_type=code&scope=profile+read`

    if (!accessToken || !airtableUserRecordId || accessToken === "" || airtableUserRecordId === "" || !userToken || userToken === "") {
        throw redirect(302, authUrl);
        return {
            allowed: false,
            relogin: true,
            reHackatime: false,
        }
    }
    if (!hackatimeVerified ||  hackatimeVerified === "") {
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
    const isVersion2 = decodedToken.version === 3;
    if(!isVersion2){
        console.info("User token is not version 2, redirecting to re-login");
        throw redirect(302, authUrl);
    }
    if (!email) {
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