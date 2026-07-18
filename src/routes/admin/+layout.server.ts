import type { LayoutServerLoad } from "./$types";
import jwt from "jsonwebtoken";
import { ADMIN_JWT_SECRET } from "$env/static/private";

interface TokenPayload extends jwt.JwtPayload {
    name?: string;
    isReviewer?: boolean;
    isT2Reviewer?: boolean;
    isShopManager?: boolean;
    isFulfiller?: boolean;
    isSuperAdmin?: boolean;
}

export const load: LayoutServerLoad = async ({ cookies }) => {
    const adminJwt = cookies.get("admin_jwt");

    if (!adminJwt) {
        return {
            admin: null
        };
    }

    try {
        const decoded = jwt.verify(
            adminJwt,
            ADMIN_JWT_SECRET
        ) as TokenPayload;

        return {
            admin: {
                name: decoded.name,
                isReviewer: decoded.isReviewer ?? false,
                isT2Reviewer: decoded.isT2Reviewer ?? false,
                isShopManager: decoded.isShopManager ?? false,
                isFulfiller: decoded.isFulfiller ?? false,
                isSuperAdmin: decoded.isSuperAdmin ?? false
            }
        };
    } catch {
        return {
            admin: null
        };
    }
};