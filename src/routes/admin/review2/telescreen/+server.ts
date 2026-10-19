import { error, json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"
import { requireAdminApi } from "$lib/server/auth"
import { getLatestTelescreenSubmission, getProjectForTelescreen } from "$lib/db"
import { ensureTelescreenSubmission, getTelescreenPastReviews, refreshTelescreenSubmission, toTelescreenView } from "$lib/server/telescreen"
import type { Log } from "$lib/types"

// T2 Telescreen panel: "refresh" re-reads the project's state from Telescreen (also done when a project is opened, so
// notes written there since show up), "submit" sends it (again) when it was never sent, the send failed, or the
// participant shipped more time since. Every answer carries the current review and the earlier ones.
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
    // Same choice as the T2 queue: the open review, or else the latest one
    const submission = await refreshTelescreenSubmission(projectIdNum) ?? await getLatestTelescreenSubmission(projectIdNum)
    let log: Log[] = []
    try { log = JSON.parse(project.log || "[]") } catch { /* unreadable log: shown as having nothing waiting */ }
    return json({
        ok: message === null,
        message,
        telescreen: toTelescreenView(submission, log),
        pastReviews: await getTelescreenPastReviews(projectIdNum),
    })
}
