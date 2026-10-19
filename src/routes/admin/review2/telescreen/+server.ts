import { error, json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { requireAdminApi } from "$lib/server/auth"
import { getProjectForTelescreen } from "$lib/db"
import { ensureTelescreenSubmission, refreshTelescreenSubmission, toTelescreenView } from "$lib/server/telescreen"
import type { Log } from "$lib/types"

// T2 Telescreen panel: "refresh" re-reads the project's state from Telescreen, "submit" sends it (again) when it
// was never sent, the send failed, or the participant shipped more time since.
export const POST: RequestHandler = async ({ request, locals }) => {
    const decoded = requireAdminApi(locals, "t2_reviewer")
    const { projectId, action } = await request.json().catch(() => ({}))
    const projectIdNum = Number(projectId)
    if (!Number.isSafeInteger(projectIdNum) || projectIdNum <= 0) {
        return error(400, "Invalid project id")
    }
    if (action !== "refresh" && action !== "submit") {
        return error(400, "Invalid action")
    }
    const project = await getProjectForTelescreen(projectIdNum)
    if (!project) {
        return error(404, "Project not found")
    }
    let message: string | null = null
    if (action === "submit") {
        const result = await ensureTelescreenSubmission(projectIdNum, decoded.name)
        if (!result.ok) message = result.message
    }
    const submission = await refreshTelescreenSubmission(projectIdNum)
    let log: Log[] = []
    try { log = JSON.parse(project.log || "[]") } catch { /* unreadable log: shown as having nothing waiting */ }
    return json({ ok: message === null, message, telescreen: toTelescreenView(submission, log) })
}
