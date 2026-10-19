import type { PageServerLoad } from './$types';
import { getAllProjectsAdmin, getCurrentTelescreenSubmissions } from '$lib/db';
import { requireAdminPage } from '$lib/server/auth';
import { refreshAwaitingReview, telescreenConfig, toTelescreenView } from '$lib/server/telescreen';
import type { Log } from '$lib/types';
export const load: PageServerLoad = async ({locals}) => {
    const decoded = requireAdminPage(locals, "t2_reviewer")
    // Robert has no webhook for "passed fraud review", so pick those up before showing the queue
    await refreshAwaitingReview().catch(error => console.error("Refreshing Telescreen states failed:", error))
    const [projectRes, submissions] = await Promise.all([getAllProjectsAdmin(), getCurrentTelescreenSubmissions()])
    let projects = await projectRes.json()
    const submissionByProject = new Map(submissions.map(submission => [submission.projectId, submission]))
    const parseLog = (raw: string): Log[] => {
        try { return JSON.parse(raw || "[]") } catch { return [] }
    }
    return {
        isAdmin: true,
        name: decoded.name || null,
        isSuperAdmin: decoded.isSuperAdmin,
        telescreenConfigured: telescreenConfig() !== null,
        projects: (projects.records || []).map((record: { id: string, fields: { log: string } }) => ({
            ...record,
            telescreen: toTelescreenView(submissionByProject.get(Number(record.id)), parseLog(record.fields.log)),
        }))
    }
}
