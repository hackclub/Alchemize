import type { PageServerLoad } from './$types';
import { START_DATE, SLACK_BOT_TOKEN } from '$env/static/private';
import { getProjectsByOwner, getUserByEmail, checkConfigByEmail, getHackatimeTokenByEmail, patchUserHackatime } from '$lib/db';
import { fetchHackatimeProjects } from '$lib/server/hackatime';
import { WebClient } from "@slack/web-api"
import { hackatimeAuthUrl, authUrl } from '$lib/utils';
import { filterLogs } from '$lib/utils.server';
import { redirect } from '@sveltejs/kit';
import { requireUserPage } from '$lib/server/auth';
import { getIdvStatus } from '$lib/server/idv';

let slackClient: WebClient = new WebClient(SLACK_BOT_TOKEN);

const getSlackProfile = async (slackId: string) => {
    if (!slackId || slackId == "") {
        return {
            display_name: "",
            image_512: "",

        }
    }
    // A Slack hiccup (rate limit, deactivated account) only costs the display name and avatar, not the page
    try {
        const result = await slackClient.users.info({ user: slackId });
        return result.user?.profile || null;
    } catch (error) {
        console.warn("Slack profile lookup failed:", (error as Error).message)
        return null
    }
}

export const load: PageServerLoad = async ({ cookies, locals }) => {
    const hackatimeVerified = cookies.get('hackatime_verified');
    const decodedToken = requireUserPage(locals)

    


    let [projectsResponse, userResponse, slackprofile, configResponse, hackatimeAccessToken, idvStatus] = await Promise.all([

        getProjectsByOwner(decodedToken.email),
        getUserByEmail(decodedToken.email),
        getSlackProfile(decodedToken.slack_id),
        checkConfigByEmail(decodedToken.email),
        getHackatimeTokenByEmail(decodedToken.email),
        // Live, like the ship check: the session's ysws_eligible is frozen at login
        getIdvStatus(decodedToken)
    ])


    const configs = await configResponse.json();
    const projectsData = typeof projectsResponse.json === 'function' ? await projectsResponse.json() : projectsResponse;
    const userData = typeof userResponse.json === 'function' ? await userResponse.json() : userResponse;
    const admin = !!cookies.get("admin_access_token")
    if (userData?.records?.length === 0) {
        throw redirect(303, "/")
    }
    if (!hackatimeAccessToken) {
        throw redirect(303, hackatimeAuthUrl)
    }
    const hackatime = await fetchHackatimeProjects(hackatimeAccessToken, START_DATE)
    if (!hackatime.ok && hackatime.reason === "unauthorized") {
        // The stored token was revoked or expired: forget it and send the user to connect Hackatime again
        await patchUserHackatime(decodedToken.email, "")
        cookies.delete("hackatime_verified", { path: "/" })
        throw redirect(303, hackatimeAuthUrl)
    }
    // If Hackatime is down the dashboard still loads, just without Hackatime projects
    let filteredHacksS = {
        projects: hackatime.ok ? hackatime.projects : []
    }
    let userFields = userData?.records?.[0]?.fields
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
        idvStatus,
        name: slackprofile?.display_name || decodedToken.first_name,
        hackatimeVerified: hackatimeVerified === "true",
        // Least privilege: the page only needs the balance, never the raw user row (ids, hackatime token, legacy JSON)
        user: { balanceHundredths: Number(userFields?.balanceHundredths ?? 0) },
        admin: admin,
        pfp: slackprofile?.image_512 || "",
        misconfigured: misconfigured
    }
};