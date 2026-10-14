import type { Log, Project, AirtableProject } from "$lib/types"
import {BOT_AUTH} from "$env/static/private"
import { requireAdminApi } from "$lib/server/auth"
import type { RequestHandler } from "@sveltejs/kit"
import {error} from "@sveltejs/kit"
import { patchProjectForShip, getProjectById } from "$lib/db"
import { applyT1Review, isOwnProject, parseDeductionMinutes } from "$lib/server/projectLog"
export const POST: RequestHandler = async ({ request, locals }) => {
    const decoded = requireAdminApi(locals, "reviewer")
    const {recordId, userExternal, internalNote, justification, decreaseTime} = await request.json()
    if (!recordId || !userExternal  || !justification ) {
        return error(400, "Missing required fields")
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
    const name = decoded.name
    const parsedLog = JSON.parse(log || "[]") as Log[]
    const deductMinutes = parseDeductionMinutes(decreaseTime, parsedLog.at(-1), "reject")
    if (typeof deductMinutes === "string") {
        return error(400, deductMinutes)
    }
    const updatedLog = applyT1Review(parsedLog, deductMinutes, "reject", { userExternal, internalNote, justification, reviewerName: name })
    const response = await patchProjectForShip(recordId, log, updatedLog, "rejected")
    if (!response.ok) {
        const errorData = await response.json()
        console.error("Failed to update project log:", {
            status: response.status,
            error: errorData,
            timestamp: new Date().toISOString()
        })
        // 409 = the log changed since it was read (e.g. a T2 award landed); the client must refresh
        return error(response.status === 409 ? 409 : 500, response.status === 409 ? errorData.message : "Failed to update project log")
    }
    // Notify only after the write has committed
    const botResponse = await fetch("https://notifications.alchemize.hackclub.com/review-reject", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${BOT_AUTH}`
            },
            body: JSON.stringify(
            { "user_id": projectData.fields.slackId, "project_name": projectData.fields.Name, "project_link": projectData.fields.code ?? "", "reviewer_id": decoded.slackId, "feedback": userExternal }
            )
        })
     
        if (!botResponse.ok) {
            console.warn(`Failed to send notification to bot for record ${recordId}:`, {
                status: botResponse.status,
                statusText: botResponse.statusText,
                timestamp: new Date().toISOString(),
                slackId: projectData.fields.slackId,
                projectName: projectData.fields.Name,
                projectLink: projectData.fields.code ?? ""
            })
                return new Response(JSON.stringify({ message: "Bot Failed to send notification", newLog: updatedLog }), { status: 207 })
    
        }
    return new Response(JSON.stringify({ message: "Log updated successfully", newLog: updatedLog }), { status: 200 })
}