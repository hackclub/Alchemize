import type {PageServerLoad} from './$types';
import {AIRTABLE, AIRTABLE_CLIENT} from "$env/static/private"
import type {AirtableUser, User, UserCurrency} from "$lib/types"
const filterPII = (userData: AirtableUser): User => {
    return {
        email: userData.fields.email,
        currency: userData.fields.currency
    }
}
export const load: PageServerLoad = async ({cookies}) => {
    const userRespone = await fetch(`https://api.airtable.com/v0/${AIRTABLE_CLIENT}/Users`, {
        headers: {
            'Authorization': `Bearer ${AIRTABLE}`,
            "Content-Type": 'application/json'
        }
    })
    const userData = await userRespone.json()

    return {userData: userData.records}
}