import type { PageServerLoad } from './$types';
import { getAllProjectsAdmin } from '$lib/db';
import { requireAdminPage } from '$lib/server/auth';
export const load: PageServerLoad = async ({locals}) => {
    const decoded = requireAdminPage(locals, "t2_reviewer")
    let projectRes = await getAllProjectsAdmin()
    let projects = await projectRes.json()
    return {
        isAdmin: true,
        name: decoded.name || null,
        projects: projects.records || []
    }
}