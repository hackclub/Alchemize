import type { PageServerLoad } from './$types';
import { START_DATE, SLACK_BOT_TOKEN } from '$env/static/private';
import { getProjectsByOwner, getUserByEmail, checkConfigByEmail } from '$lib/db';
import { WebClient } from "@slack/web-api"
import { hackatimeAuthUrl, authUrl } from '$lib/utils';
import { filterLogs } from '$lib/utils.server';
import { redirect } from '@sveltejs/kit';
import { requireUserPage } from '$lib/server/auth';

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

export const load: PageServerLoad = async ({ cookies, locals }) => {
    const hackatimeVerified = cookies.get('hackatime_verified');
    const decodedToken = requireUserPage(locals)

    


    let [projectsResponse, userResponse, slackprofile, configResponse] = await Promise.all([

        getProjectsByOwner(decodedToken.email),
        getUserByEmail(decodedToken.email),
        getSlackProfile(decodedToken.slack_id),
        checkConfigByEmail(decodedToken.email)
    ])


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
        // Least privilege: the page only needs the balance, never the raw user row (ids, hackatime token, legacy JSON)
        user: { balanceHundredths: Number(userFields?.balanceHundredths ?? 0) },
        admin: admin,
        pfp: slackprofile?.image_512 || "",
        misconfigured: misconfigured
    }
};