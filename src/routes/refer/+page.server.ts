
import { BASE_URL, SLACK_BOT_TOKEN, USER_JWT_SECRET } from '$env/static/private';
import type { PageServerLoad } from './$types';
import { WebClient } from "@slack/web-api"
import type { AirtableReferRecord, Refers } from '$lib/types';
import { getAllRefers } from '$lib/db';
import { redirect } from '@sveltejs/kit';
import { authUrl } from '$lib/utils';
import { createReferralCode, deriveReferralKey } from '$lib/server/referralCode';
import pLimit from 'p-limit';

const referralKey = deriveReferralKey(USER_JWT_SECRET)

const slackClient = new WebClient(SLACK_BOT_TOKEN)
// The leaderboard needs a display name per referrer on every page view. Cache them, ask Slack a few at a
// time, and never let one unknown or deleted Slack account fail the whole page.
const NAME_CACHE_MS = 60 * 60 * 1000
const nameCache = new Map<string, { name: string, fetchedAt: number }>()
const slackLimit = pLimit(4)
async function getUserName(userId: string) {
    const cached = nameCache.get(userId)
    if (cached && Date.now() - cached.fetchedAt < NAME_CACHE_MS) {
        return cached.name
    }
    let name = "Unknown User"
    try {
        const result = await slackLimit(() => slackClient.users.info({ user: userId }));
        name = result.user?.profile?.display_name || result.user?.real_name || "Unknown User";
    } catch (error) {
        console.warn("Slack users.info failed for a referrer:", (error as Error).message)
    }
    nameCache.set(userId, { name, fetchedAt: Date.now() })
    return name
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
    const entries = Object.entries(slackUidCounts);
    const usernamePromises = entries.map(async ([key, value]) => {
        const uid = await getUserName(key);
        return { uid, value };
    });

    const resolvedUsers = await Promise.all(usernamePromises);


    const slackCounts: Record<string, number> = {}
    for (const { uid, value } of resolvedUsers) {
        slackCounts[uid] = (slackCounts[uid] || 0) + value
    }

    return slackCounts;
}
export const load: PageServerLoad = async ({ locals }) => {
    const data = locals.user;
    if (!data?.id || !data?.slack_id) {
        throw redirect(302, authUrl);
    }
    const id = encodeURIComponent(createReferralCode(data.id, data.slack_id, referralKey));
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