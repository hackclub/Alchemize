import type {PageServerLoad} from './$types';
import type {AirtableUser, User, UserCurrency} from "$lib/types"
import { getAllUsers } from '$lib/db';
import { ADMIN_JWT_SECRET } from '$env/static/private';
import { redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
const filterPII = (userData: AirtableUser): User => {
    return {
        email: userData.fields.email,
        currency: userData.fields.currency
    }
}
export const load: PageServerLoad = async ({cookies}) => {
        const adminAccessToken = cookies.get("admin_access_token")
        const adminJwt = cookies.get("admin_jwt")
        if (!adminAccessToken || !adminJwt) {
            throw redirect(303, "/admin/login")
        }
        
        let decoded = jwt.verify(adminJwt, ADMIN_JWT_SECRET );
        //@ts-ignore
        if (!decoded || !decoded.name || !decoded.isSuperAdmin) {
            throw redirect(303, "/admin/login")
        }
    
    
    const userRespone = await getAllUsers()
    const userData = await userRespone.json()

    return {userData: userData.records}
}