
import { USERID_ENCRYPTION_KEY, BASE_URL,SLACK_BOT_TOKEN, USER_JWT_SECRET } from '$env/static/private';
import type { PageServerLoad } from './$types';
import {WebClient} from "@slack/web-api"
import type { AirtableReferRecord, Refers } from '$lib/types';
import { getAllRefers } from '$lib/db';
import jwt from 'jsonwebtoken';



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
    const userToken = cookies.get('user_token');
    let data: any = null;
    if (userToken) {
        try {
            data = jwt.verify(userToken, USER_JWT_SECRET);
        }
        catch (err) {
            console.error("Error verifying JWT:", err);
        }  
    }
    const id = encodeURIComponent(XORencrypt(`${data.id.slice(6)} ${data.slack_id}`));
    let referalsResponse = await getAllRefers()
    if (!referalsResponse.ok) {
        throw new Error(`Failed to fetch referals data: ${await referalsResponse.text()}`);
    }
    let referalsData: { records: AirtableReferRecord[] } = await referalsResponse.json();
    let myReferals = getMyReferals(data.id.slice(6), referalsData.records);
    let referedCountsByReferer = await getReferedCountsByReferer(referalsData.records);
    return {
        url: `${BASE_URL}/?refer=${id}`,
        myReferals,
        counts: referedCountsByReferer,
        
    }
}