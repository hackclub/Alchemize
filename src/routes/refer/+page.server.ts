
import { USERID_ENCRYPTION_KEY, BASE_URL, AIRTABLE_CLIENT, AIRTABLE, SLACK_BOT_TOKEN } from '$env/static/private';
import type { PageServerLoad } from './$types';
import {WebClient} from "@slack/web-api"
import type { AirtableReferRecord, Refers } from '$lib/types';




const XORencrypt = (textInp: string) => {
    const tb = Buffer.from(textInp, 'utf-8');
    const kb = Buffer.from(USERID_ENCRYPTION_KEY, "hex");
    const out = Buffer.alloc(tb.length)

    for (let i = 0; i < tb.length; i++) {
        out[i] = tb[i] ^ kb[i % kb.length]
    }
    return out.toString('base64');


}

const slackClient = new WebClient(SLACK_BOT_TOKEN)
async function getUserName(userId:string) {
  const result = await slackClient.users.info({ user: userId });
  
  return result.user?.profile?.display_name || "Unknown User"; 
}
const getMyReferals = (userId: string, allRefers: AirtableReferRecord[]): Refers[] => {
    const myReferals: Refers[] = []
    allRefers.forEach((referRecord) => {
        if (referRecord.fields.referer.split(' ')[0] === userId) {
            myReferals.push({
                referer: referRecord.fields.referer,
                referedName: referRecord.fields.referedName
            })
        }
    })
    return myReferals;
}
const getReferedCountsByReferer = async (allRefers: AirtableReferRecord[]): Promise<Record<string, number>> => {
    const counts: Record<string, number> = {}
    allRefers.forEach((referRecord) => {
        const refererId = referRecord.fields.referer
        counts[refererId] = (counts[refererId] || 0) + 1
    })
    const slackUidCounts: Record<string, number> = {}
    for (const [key, value] of Object.entries(counts)) {
        const uid = key.split(' ')[1]
        slackUidCounts[uid] = (slackUidCounts[uid] || 0) + value

    }
    const slackCounts: Record<string, number> = {}
        
    for (const [key, value] of Object.entries(slackUidCounts)) {
        const uid = await getUserName(key)
        slackCounts[uid] = (slackCounts[uid] || 0) + value

    }
    return slackCounts
}
export const load: PageServerLoad = async ({ url, cookies }) => {
    const at = cookies.get('access_token_new');
    const request = await fetch("https://auth.hackclub.com/api/v1/me", {
        headers: {
            Authorization: `Bearer ${at}`,
        }
    })
    if (!request.ok) {
        console.warn("Failed to fetch user data:", request.statusText);
        return {
            url: null,
            myReferals: [],
            counts: {}
        }
    }
    const data = await request.json()
    const id = encodeURIComponent(XORencrypt(`${data.identity.id.slice(6)} ${data.identity.slack_id}`));
    let referalsResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_CLIENT}/refers`, {
        headers: {
            Authorization: `Bearer ${AIRTABLE}`,
            "Content-Type": 'application/json'
        }
    });
    if (!referalsResponse.ok) {
        throw new Error(`Failed to fetch referals data: ${referalsResponse.statusText}`);
    }
    let referalsData: { records: AirtableReferRecord[] } = await referalsResponse.json();
    let myReferals = getMyReferals(data.identity.id.slice(6), referalsData.records);
    let referedCountsByReferer = await getReferedCountsByReferer(referalsData.records);
    return {
        url: `${BASE_URL}/?refer=${id}`,
        myReferals,
        counts: referedCountsByReferer,
        
    }
}