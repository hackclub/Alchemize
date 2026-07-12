import type { Actions } from './$types';
import { createRSVP } from '$lib/db';
export const actions = {
    default: async event => {
        const formData = await event.request.formData();
        const score = formData.get('score');
        const hear = formData.get('hear');
        const well = formData.get('well');
        const better = formData.get('better');
        const anythingElse = formData.get('else');
        const slackId = formData.get('slack');
        const data = {
            score, hear, well, better, anythingElse, slackId
        }
        createRSVP({
            name: "NPS",
            moreData: data,
            slackId: slackId as string
        })
    }
} as Actions;