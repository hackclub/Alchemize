import type { PageServerLoad } from './$types';
import { getAllProjects } from '$lib/db';
import { requireAdminPage } from '$lib/server/auth';
export const load: PageServerLoad = async ({locals}) => {
    const decoded = requireAdminPage(locals, "reviewer")
    let projectRes = await getAllProjects()
    let projects = await projectRes.json()
    const projectRecords = projects.records || []

    return {
        isAdmin: true,
        name: decoded.name || null,
        projects: projects.records || []
    }
}