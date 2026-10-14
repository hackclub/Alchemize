import type { LayoutServerLoad } from './$types';
import { requireAdminPage } from '$lib/server/auth';
export const load: LayoutServerLoad = async ({locals}) => {
    const decoded = requireAdminPage(locals, "super_admin")


    return {
        isAdmin: true,
        name: decoded.name || null,
        isSuperAdmin: decoded.isSuperAdmin || false
    }
}