import type { PageServerLoad } from "./$types"
import { getAllProjects } from "$lib/db"
import { requireAdminPage } from "$lib/server/auth"
export const load: PageServerLoad = async ({ locals }) => {
	const decoded = requireAdminPage(locals, "reviewer")
	const projectRes = await getAllProjects()
	const projects = await projectRes.json()

	return {
		isAdmin: true,
		name: decoded.name || null,
		projects: projects.records || [],
	}
}
