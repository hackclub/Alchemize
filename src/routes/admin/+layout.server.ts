import type { LayoutServerLoad } from "./$types";

// Roles come from the admins table on every request (see $lib/server/auth), not from the JWT claims
export const load: LayoutServerLoad = async ({ locals }) => {
    if (!locals.admin) {
        return {
            admin: null
        };
    }
    return {
        admin: {
            name: locals.admin.name,
            isReviewer: locals.admin.isReviewer,
            isT2Reviewer: locals.admin.isT2Reviewer,
            isShopManager: locals.admin.isShopManager,
            isFulfiller: locals.admin.isFulfiller,
            isSuperAdmin: locals.admin.isSuperAdmin
        }
    };
};
