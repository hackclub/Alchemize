import type { PageServerLoad } from './$types';
import { START_DATE, SLACK_BOT_TOKEN, USER_JWT_SECRET } from '$env/static/private';
import { getProjectsByOwner, getUserByEmail } from '$lib/db';
import { WebClient } from "@slack/web-api"
import { redirect } from '@sveltejs/kit';
import jwt from "jsonwebtoken"

let slackClient: WebClient = new WebClient(SLACK_BOT_TOKEN);

const getSlackProfile = async (slackId: string) => {
    const result = await slackClient.users.info({ user: slackId });
    return result.user?.profile || null;
}

export const load: PageServerLoad = async ({ cookies }) => {
    const at = cookies.get('access_token_new');
    const hackatimeVerified = cookies.get('hackatime_verified');
    const userToken = cookies.get("user_token")
    let decodedToken: any = null

    try {
        if (userToken) {
            const decoded: any = jwt.verify(userToken, USER_JWT_SECRET);
            decodedToken = decoded
        } else {
            throw new Error("No user token found");
        }
    } catch (error) {
        console.error("Error decoding user token:", error);
        throw new Error("Invalid user token");
    }

    let hackatimeAccessToken = cookies.get('hackatime_token');
    let hacks: any = ""
    if (!hackatimeAccessToken) {
        cookies.set('hackatime_verified', 'false', { path: '/' });
        cookies.set('hackatime_token', '', { path: '/', expires: new Date(0) });
        return redirect(303, "/")
    }

    let [hackatimes, projectsResponse, userResponse, slackprofile] = await Promise.all([
        fetch(`https://hackatime.hackclub.com/api/v1/authenticated/projects?include_archived=false&start=${START_DATE}`, {
            headers: {
                Authorization: `Bearer ${hackatimeAccessToken}`,
                "Content-Type": 'application/json'
            }
        }),
        getProjectsByOwner(decodedToken.email),
        getUserByEmail(decodedToken.email),
        getSlackProfile(decodedToken.slack_id)
    ])

    hacks = await hackatimes.json()

    if (!at) {
        return {
            projects: [],
            hacks: hacks,
            email: decodedToken.email,
            eligiblity: decodedToken.ysws_eligible,
            name: slackprofile?.display_name || decodedToken.first_name,
            hackatimeVerified: hackatimeVerified === "true",
            user: {},
            admin: !!cookies.get("admin_access_token"),
            pfp: slackprofile?.image_512 || ""
        }
    }

    const projectsData = typeof projectsResponse.json === 'function' ? await projectsResponse.json() : projectsResponse;
    const userData = typeof userResponse.json === 'function' ? await userResponse.json() : userResponse;
    const admin = !!cookies.get("admin_access_token")

    return {
        projects: projectsData?.records || [],
        hacks: hacks,
        email: decodedToken.email,
        eligiblity: decodedToken.ysws_eligible,
        name: slackprofile?.display_name || decodedToken.first_name,
        hackatimeVerified: hackatimeVerified === "true",
        user: userData?.records?.[0]?.fields ?? {},
        admin: admin,
        pfp: slackprofile?.image_512 || ""
    }
};