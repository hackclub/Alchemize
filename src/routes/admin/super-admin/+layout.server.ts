import type { LayoutServerLoad } from './$types';
import jwt from "jsonwebtoken"
import {ADMIN_JWT_SECRET} from "$env/static/private"
import { redirect } from "@sveltejs/kit"
interface TokenPayload extends jwt.JwtPayload {
    name?: string;
    isSuperAdmin?: boolean;
}
export const load: LayoutServerLoad = async ({cookies}) => {
    const adminAccessToken = cookies.get("admin_access_token")
    const adminJwt = cookies.get("admin_jwt")
    if (!adminAccessToken || !adminJwt) {
        throw redirect(303, "/admin/login")
    }
    
    let decoded = jwt.verify(adminJwt, ADMIN_JWT_SECRET ) as TokenPayload;
    if (!decoded || !decoded.name || !decoded.isSuperAdmin) {
        throw redirect(303, "/admin/login")
    }


    return {
        isAdmin: true,
        name: decoded.name || null,
        isSuperAdmin: decoded.isSuperAdmin || false
    }
}