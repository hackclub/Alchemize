import type { PageServerLoad } from './$types';
import jwt from "jsonwebtoken"
import {ADMIN_JWT_SECRET} from "$env/static/private"
import { redirect } from "@sveltejs/kit"
interface TokenPayload extends jwt.JwtPayload {
    name?: string;
    isReviewer?: boolean;
    isT2Reviewer?: boolean;
    isShopManager?: boolean;
    isFulfiller?: boolean;
    isSuperAdmin?: boolean;
}
export const load: PageServerLoad = async ({cookies}) => {
    const adminAccessToken = cookies.get("admin_access_token")
    const adminJwt = cookies.get("admin_jwt")
    if (!adminAccessToken || !adminJwt) {
        throw redirect(303, "/admin/login")
    }
    
    let decoded = jwt.verify(adminJwt, ADMIN_JWT_SECRET) as TokenPayload;
    if (!decoded || !decoded.name) {
        throw redirect(303, "/admin/login")
    }

    return {
        isAdmin: true,
        name: decoded.name || null,
        isReviewer: decoded.isReviewer || false,
        isT2Reviewer: decoded.isT2Reviewer || false,
        isShopManager: decoded.isShopManager || false,
        isFulfiller: decoded.isFulfiller || false,
        isSuperAdmin: decoded.isSuperAdmin || false
    }
}