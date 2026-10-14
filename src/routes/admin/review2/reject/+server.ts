import type { Log, Project, AirtableProject } from "$lib/types"
import {BOT_AUTH} from "$env/static/private"
import { requireAdminApi } from "$lib/server/auth"
import type { RequestHandler } from "@sveltejs/kit"
import {error} from "@sveltejs/kit"
import { patchProjectForShip, getProjectById } from "$lib/db"
import { applyT2Reject, isOwnProject } from "$lib/server/projectLog"
export const POST: RequestHandler = async ({ request, locals }) => {
    const decoded = requireAdminApi(locals, "t2_reviewer")
    const {recordId, userExternal, justification} = await request.json()
    if (!recordId || !userExternal  || !justification) {
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
    // The notification goes to the project's owner as stored in the DB, never to a client-supplied ID
    const slackId = projectData.fields.slackId
    if (projectData.fields.status === "accepted_t2" ) {
        return error(400, "Cannot overturn a project that has been accepted by a T2 reviewer")
    }
    if (projectData.fields.status === "rejected"){
        return error(400, "Project has already been rejected")
    }
    const log = projectData.fields.log
    const name = decoded.name
    const updatedLog = applyT2Reject(JSON.parse(log || "[]"), userExternal)
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
            { "user_id": slackId, "project_name": projectData.fields.Name, "project_link": projectData.fields.code ?? "", "reviewer_id": decoded.slackId, "feedback": userExternal }
            )
        })
     
        if (!botResponse.ok) {
            console.warn(`Failed to send notification to bot for record ${recordId}:`, {
                status: botResponse.status,
                statusText: botResponse.statusText,
                timestamp: new Date().toISOString(),
                slackId: slackId,
                projectName: projectData.fields.Name,
                projectLink: projectData.fields.code ?? ""
            })
                return new Response(JSON.stringify({ message: "Bot Failed to send notification", newLog: updatedLog }), { status: 207 })
    
        }
    return new Response(JSON.stringify({ message: "Log updated successfully", newLog: updatedLog }), { status: 200 })
}