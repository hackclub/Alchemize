import type { PageServerLoad } from './$types';
import { START_DATE, SLACK_BOT_TOKEN, USER_JWT_SECRET } from '$env/static/private';
import { getProjectsByOwner, getUserByEmail, checkConfigByEmail } from '$lib/db';
import { WebClient } from "@slack/web-api"
import { hackatimeAuthUrl, authUrl } from '$lib/utils';
import { filterLogs } from '$lib/utils.server';
import { redirect } from '@sveltejs/kit';
import jwt from "jsonwebtoken"

let slackClient: WebClient = new WebClient(SLACK_BOT_TOKEN);

const getSlackProfile = async (slackId: string) => {
    if (!slackId || slackId == "") {
        return {
            display_name: "",
            image_512: "",

        }
    }
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
            throw redirect(302, authUrl);
        }
    } catch (error) {
        console.error("Error decoding user token:", error);
        throw redirect(302, authUrl);
    }

    


    let [projectsResponse, userResponse, slackprofile, configResponse] = await Promise.all([

        getProjectsByOwner(decodedToken.email),
        getUserByEmail(decodedToken.email),
        getSlackProfile(decodedToken.slack_id),
        checkConfigByEmail(decodedToken.email)
    ])


    if (!at) {
        return {
            projects: [],
            hacks: [],
            email: decodedToken.email,
            eligiblity: decodedToken.ysws_eligible,
            name: slackprofile?.display_name || decodedToken.first_name,
            hackatimeVerified: hackatimeVerified === "true",
            user: {},
            admin: !!cookies.get("admin_access_token"),
            pfp: slackprofile?.image_512 || "",
            misconfigured: []
        }
    }
    const configs = await configResponse.json();
    const projectsData = typeof projectsResponse.json === 'function' ? await projectsResponse.json() : projectsResponse;
    const userData = typeof userResponse.json === 'function' ? await userResponse.json() : userResponse;
    const admin = !!cookies.get("admin_access_token")
    let hackatimeAccessToken = userData?.records?.[0]?.fields?.hackatime;
    if (userData?.records?.length === 0) {
        throw redirect(303, "/")
    }
if (!hackatimeAccessToken || hackatimeAccessToken === "") {
    throw redirect(303, hackatimeAuthUrl)
}
    let hackatimes = await fetch(`https://hackatime.hackclub.com/api/v1/authenticated/projects?include_archived=false&start=${START_DATE}`, {
            headers: {
                Authorization: `Bearer ${hackatimeAccessToken}`,
                "Content-Type": 'application/json'
            }
        });
    let hacks = await hackatimes.json()
    let filteredHacks: any[] = []
    hacks.projects.forEach((project: any) => {
        filteredHacks.push({
            name: project.name,
            total_seconds: project.total_seconds,
        })
    })
    let filteredHacksS = {
        projects: filteredHacks
    }
    let userFields = userData?.records?.[0]?.fields
    let {hackatime, ...userFieldsWithoutHackatime} = userFields || {}
    let misconfigured = []
    if(!configs.address)
        misconfigured.push("Address")
    if(!configs.birthdate)
        misconfigured.push("Birthdate")
    if(!configs.firstName)
        misconfigured.push("First Name")
    if(!configs.lastName)
        misconfigured.push("Last Name")
    const sanitizedProjects = (projectsData?.records || []).map((record: any) => ({
        ...record,
        fields: {
            ...record.fields,
            log: filterLogs(record.fields?.log ?? "")
        }
    }))
    return {
        projects: sanitizedProjects,
        hacks: filteredHacksS || [],
        email: decodedToken.email,
        eligiblity: decodedToken.ysws_eligible,
        name: slackprofile?.display_name || decodedToken.first_name,
        hackatimeVerified: hackatimeVerified === "true",
        user: userFieldsWithoutHackatime ?? {},
        admin: admin,
        pfp: slackprofile?.image_512 || "",
        misconfigured: misconfigured
    }
};