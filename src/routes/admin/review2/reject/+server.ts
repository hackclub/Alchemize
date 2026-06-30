import type { Log, Project, AdminJWT, AirtableProject } from "$lib/types"
import jwt from "jsonwebtoken"
import {ADMIN_JWT_SECRET, BOT_AUTH} from "$env/static/private"
import type { RequestHandler } from "@sveltejs/kit"
import {error} from "@sveltejs/kit"
import { patchProjectForShip, getProjectById } from "$lib/db"
import { updated } from "$app/state"
function updateLog(log: Log[], rejectionReason: string): Log[] {

	if (log.length === 0) {
		return log
	}
	const lastLog = log[log.length - 1]
	if (lastLog.status === 0 || lastLog.status === 1) {
		
		return [...log.slice(0, -1), {
			...lastLog,
			status: 0,
			timestamp: new Date().toISOString(),
			deltaTime: lastLog.deltaTime,
			message: [...lastLog.message, { userExternal: `Hiya! Your project failed T2 review, REASON: ${rejectionReason}`, internalNote: "Rejected at T2", justification: "Rejected at T2", timestamp: new Date().toISOString(), reviewerName: "T2 Reviewer" }],
			submmitedToHQ: false
		}]
	} else {
		return log
	}

}
export const POST: RequestHandler = async ({ request,cookies }) => {
    const adminJWTToken = cookies.get("admin_jwt")
    if (!adminJWTToken) {
        return error(401, "Unauthorized")
    }
    let decoded: AdminJWT
    try {
         decoded = jwt.verify(adminJWTToken, ADMIN_JWT_SECRET) as AdminJWT
        if (!decoded.isT2Reviewer ) {
            return error(401, "Unauthorized")
        }
    } catch (err) {
        return error(401, "Unauthorized")
    }
    const {recordId, userExternal, justification, slackId} = await request.json()
    if (!recordId || !userExternal  || !justification || !slackId) {
        return error(400, "Missing required fields")
    }
    const readProject = await getProjectById(recordId)
    const projectData: AirtableProject = await readProject.json()
    if (!readProject.ok || !projectData) {
        return error(404, "Project not found")
    }
    if (projectData.fields.status === "accepted_t2" ) {
        return error(400, "Cannot overturn a project that has been accepted by a T2 reviewer")
    }
    if (projectData.fields.status === "rejected"){
        return error(400, "Project has already been rejected")
    }
    const log = projectData.fields.log
    const name = decoded.name
    const updatedLog = updateLog(JSON.parse(log),  userExternal)
    const [response, botResponse] = await Promise.all([
        patchProjectForShip(recordId, updatedLog, "rejected"),
        fetch("https://aoishik.qzz.io/review-reject", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${BOT_AUTH}`
            },
            body: JSON.stringify(
            { "user_id": slackId, "project_name": projectData.fields.Name, "project_link": projectData.fields.code ?? "", "reviewer_id": decoded.slackId, "feedback": userExternal }
            )
        })
    ])
    if (!response.ok) {
        const errorData = await response.json()
        console.error("Failed to update project log:", {
            status: response.status,
            error: errorData,
            timestamp: new Date().toISOString()
        })
        return error(500, "Failed to update project log")
    }
     
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