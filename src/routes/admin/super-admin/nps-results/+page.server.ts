import {getNPSResults} from "$lib/db";
import jwt from "jsonwebtoken"
import {ADMIN_JWT_SECRET} from "$env/static/private"
import { redirect } from "@sveltejs/kit"
export const load = async ({cookies}) => {
    const adminJwt = cookies.get("admin_jwt")
    if (!adminJwt) {
        throw redirect(303, "/admin/login")
    }
    let decoded = jwt.verify(adminJwt, ADMIN_JWT_SECRET ) as jwt.JwtPayload;
    if (!decoded || !decoded.name || !decoded.isSuperAdmin) {
        throw redirect(303, "/admin/login")
    }
    const npsResults = await getNPSResults();
    return {
        npsResults: npsResults.ok ? await npsResults.json() : null,
    };
}