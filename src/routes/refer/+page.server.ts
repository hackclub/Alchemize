
import { USERID_ENCRYPTION_KEY, BASE_URL, AIRTABLE_CLIENT, AIRTABLE } from '$env/static/private';
import type { PageServerLoad } from './$types';


const XORencrypt = (textInp: string) => {
    const tb = Buffer.from(textInp, 'utf-8');
    const kb = Buffer.from(USERID_ENCRYPTION_KEY, "hex");
    const out = Buffer.alloc(tb.length)

    for (let i = 0; i < tb.length; i++) {
        out[i] = tb[i] ^ kb[i % kb.length]
    }
    return out.toString('base64');


}

interface AirtableReferRecord {
    id: string;
    createdTime: string;
    fields: {
        referedEmail: string;
        referer: string;
        yswsEligible: string
        verified: string;
        referedName: string;
    }
}
interface Refers {
    referer: string;
    referedName: string;
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
const getReferedCountsByReferer = (allRefers: AirtableReferRecord[]): Record<string, number> => {
    const counts: Record<string, number> = {}
    allRefers.forEach((referRecord) => {
        const refererId = referRecord.fields.referer
        counts[refererId] = (counts[refererId] || 0) + 1
    })
    const nameCounts: Record<string, number> = {}
    for (const [key, value] of Object.entries(counts)) {
        const name = key.split(' ')[1]
        nameCounts[name] = (nameCounts[name] || 0) + value

    }
    return nameCounts
}
export const load: PageServerLoad = async ({ url, cookies }) => {
    const at = cookies.get('access_token_new');
    const request = await fetch("https://auth.hackclub.com/api/v1/me", {
        headers: {
            Authorization: `Bearer ${at}`,
        }
    })
    const data = await request.json()
    const id = encodeURIComponent(XORencrypt(`${data.identity.id} ${data.identity.first_name}`));
    let referalsResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_CLIENT}/refers`, {
        headers: {
            Authorization: `Bearer ${AIRTABLE}`,
            "Content-Type": 'application/json'
        }
    });
    let referalsData: { records: AirtableReferRecord[] } = await referalsResponse.json();
    let myReferals = getMyReferals(data.identity.id, referalsData.records);
    let referedCountsByReferer = getReferedCountsByReferer(referalsData.records);
    return {
        url: `${BASE_URL}/?refer=${id}`,
        myReferals,
        counts: referedCountsByReferer
    }
}