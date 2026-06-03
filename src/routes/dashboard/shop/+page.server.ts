import type { PageServerLoad } from './$types';
import { AIRTABLE, AIRTABLE_CLIENT } from '$env/static/private';
import itemsJson from "./items.json"
import type { Item } from "$lib/types"
import { getUserByEmail } from '$lib/db';
export const load: PageServerLoad = async ({ cookies }) => {
    const items: Item[] = itemsJson as Item[];
    const at = cookies.get('access_token_new');
    const fetchRes = await fetch("https://auth.hackclub.com/api/v1/me", {
        headers: {
            Authorization: `Bearer ${at}`,
        },
        method: "GET"
    })
    const data = await fetchRes.json()
    const email = data?.identity?.primary_email;
    const userResponse = await getUserByEmail(email);

  
    const userData = await userResponse.json();
    const userRecord = userData.records[0];
    console.log(userRecord);
    return {
        items,
        userRecord
    }
}