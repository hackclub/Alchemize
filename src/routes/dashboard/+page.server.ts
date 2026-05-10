import type { PageServerLoad } from './$types';
import { AIRTABLE, AIRTABLE_CLIENT, START_DATE } from '$env/static/private';

export const load: PageServerLoad = async ({ cookies }) => {
    const at = cookies.get('access_token_new');
    const hackatimeVerified = cookies.get('hackatime_verified');
    const fetchRes = await fetch("https://auth.hackclub.com/api/v1/me", {
        headers: {
            Authorization: `Bearer ${at}`,
        },
        method: "GET"
    })
    
    const data = await fetchRes.json()
    if (!fetchRes.ok) {
        return {
            error: data?.message ?? "Failed to fetch user data"
        }
    }

    let hackatimeAccessToken = cookies.get('hackatime_token');
    let hacks = ""
    if (hackatimeAccessToken) {

        let hackatimes = await fetch(`https://hackatime.hackclub.com/api/v1/authenticated/projects?include_archived=false&start=${START_DATE}`, {
            headers: {
                Authorization: `Bearer ${hackatimeAccessToken}`,
                "Content-Type": 'application/json'
            }
        })
        hacks = await hackatimes.json()

    }

    if (!at) {
        return {
            projects: []
        }
    }
    let projectsResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_CLIENT}/Projects?filterByFormula={owner}="${encodeURIComponent(data.identity.primary_email)}"`, {
        headers: {
            Authorization: `Bearer ${AIRTABLE}`,
            "Content-Type": 'application/json'
        }
    });
    let userResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_CLIENT}/Users?filterByFormula={email}="${encodeURIComponent(data.identity.primary_email)}"`, {
        headers: {
            Authorization: `Bearer ${AIRTABLE}`,
            "Content-Type": 'application/json'
        }
    });
    const projectsData = await projectsResponse.json();
    const userData = await userResponse.json();
    return {
        projects: projectsData.records,
        hacks: hacks,
        email: data.identity.primary_email,
        eligiblity: data.identity.ysws_eligible,
        name: data.identity.first_name,
        hackatimeVerified: hackatimeVerified === "true",
        user: userData.records?.[0]?.fields ?? {}
    }
};