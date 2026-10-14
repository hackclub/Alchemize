import type {PageServerLoad} from './$types';
import type {AirtableUser, User} from "$lib/types"
import { getAllUsers } from '$lib/db';
import { requireAdminPage } from '$lib/server/auth';
const filterPII = (userData: AirtableUser): User => {
    return {
        email: userData.fields.email,
        balanceHundredths: userData.fields.balanceHundredths
    }
}
export const load: PageServerLoad = async ({locals}) => {
    requireAdminPage(locals, "super_admin")
    const userRespone = await getAllUsers()
    const userData = await userRespone.json()

    // The page lists emails only; never send ids or Slack IDs it doesn't use
    return {userData: userData.records.map((record: AirtableUser) => ({ fields: filterPII(record) }))}
}