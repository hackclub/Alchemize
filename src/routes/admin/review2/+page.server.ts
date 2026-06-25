import type { PageServerLoad } from './$types';
import jwt from "jsonwebtoken"
import {ADMIN_JWT_SECRET} from "$env/static/private"
import { redirect } from "@sveltejs/kit"
import { getAllProjectsAdmin } from '$lib/db';
interface TokenPayload extends jwt.JwtPayload {
    name?: string;
    isT2Reviewer?: boolean;
}
export const load: PageServerLoad = async ({cookies}) => {
    const adminAccessToken = cookies.get("admin_access_token")
    const adminJwt = cookies.get("admin_jwt")
    if (!adminAccessToken || !adminJwt) {
        throw redirect(303, "/admin/login")
    }
    
    let decoded = jwt.verify(adminJwt, ADMIN_JWT_SECRET) as TokenPayload;
    if (!decoded || !decoded.name || !decoded.isT2Reviewer) {
        throw redirect(303, "/admin/login")
    }
    let projectRes = await getAllProjectsAdmin()
    let projects = await projectRes.json()
    return {
        isAdmin: true,
        name: decoded.name || null,
        projects: projects.records || []
    }
}