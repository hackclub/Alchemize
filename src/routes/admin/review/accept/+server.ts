import type { Log, AirtableProject } from "$lib/types";
import type { RequestHandler } from "./$types";
import { error } from "@sveltejs/kit"
import { getProjectById, patchProjectForShip } from "$lib/db";
import { requireAdminApi } from "$lib/server/auth";
import { applyT1Review, isOwnProject, parseDeductionMinutes } from "$lib/server/projectLog";
import { ensureTelescreenSubmission } from "$lib/server/telescreen";

export const POST: RequestHandler = async ({ request, locals }) => {
    const decoded = requireAdminApi(locals, "reviewer")
    const approver = decoded.name

    const { recordId, userExternal, internalNote, justification, decreaseTime } = await request.json()
    if (!recordId || !userExternal || !justification ) {
        return new Response("Missing required fields", { status: 400 })
    }
        const readProject = await getProjectById(recordId)
        if (!readProject.ok) {
            return error(404, "Project not found")
        }
        const projectData: AirtableProject = await readProject.json()
        if (isOwnProject(decoded, projectData.fields)) {
            return error(403, "You can't review your own project")
        }
        if (projectData.fields.status === "accepted_t2" ) {
            return error(400, "Cannot overturn a project that has been accepted by a T2 reviewer")
        }
        const log = projectData.fields.log
    const oldLog = JSON.parse(log || "[]") as Log[]
    // Besides the deduction, this refuses anything but a pending entry: a rejected (T1 or T2) or already
    // approved entry can't be accepted, the participant has to ship again first
    const deductMinutes = parseDeductionMinutes(decreaseTime, oldLog.at(-1), "accept")
    if (typeof deductMinutes === "string") {
        return error(400, deductMinutes)
    }
    const newLog = applyT1Review(oldLog, deductMinutes, "accept", { userExternal, internalNote, justification, reviewerName: approver })


    const response = await patchProjectForShip(recordId, log, newLog, "accepted")
    if (!response.ok) {
        const errorData = await response.json()
        console.error("Failed to update project log:", {
            status: response.status,
            error: errorData,
            timestamp: new Date().toISOString()
        })
        // 409 = the log changed since it was read (e.g. a T2 award landed); the reviewer must refresh
        if (response.status === 409) {
            return new Response(errorData.message, { status: 409 })
        }
        return new Response("Failed to update project log", { status: 500 })
    }




    // Accepted projects go to Telescreen's fraud review before T2. A failure doesn't undo the accept: the T2 page
    // shows the project as not sent and can retry
    const telescreen = await ensureTelescreenSubmission(Number(projectData.id), approver).catch(error => {
        console.error(`Telescreen submission for project ${recordId} failed:`, error)
        return { ok: false as const, message: "Couldn't send the project to Telescreen" }
    })
    if (!telescreen.ok) {
        console.warn(`Project ${recordId} accepted but not sent to Telescreen: ${telescreen.message}`)
    }

    return new Response(JSON.stringify({
        message: "Project accepted",
        newLog: newLog,
        telescreen: telescreen.ok ? { ok: true } : { ok: false, message: telescreen.message },
    }), { status: 200 })

}
