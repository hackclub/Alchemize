import type { Log, Project, AdminJWT, AirtableProject } from "$lib/types"
import jwt from "jsonwebtoken"
import {ADMIN_JWT_SECRET, BOT_AUTH} from "$env/static/private"
import type { RequestHandler } from "@sveltejs/kit"
import {error} from "@sveltejs/kit"
import { patchProjectForShip, getProjectById } from "$lib/db"
// T1 "Deduct hours" arrives in hours (null when the input is left empty); log deltas are stored in minutes.
// Returns the minutes to deduct from the last log entry, or an error message.
function parseDeductionMinutes(decreaseTime: unknown, lastLog: Log | undefined): number | string {
    const hours = decreaseTime ?? 0
    if (typeof hours !== "number" || !Number.isFinite(hours) || hours < 0) {
        return "Deducted hours must be a non-negative number"
    }
    if (!lastLog) {
        return "Project has no log to review"
    }
    const minutes = Math.round(hours * 60)
    if (minutes > lastLog.deltaTime) {
        return `Cannot deduct ${hours}h, this review's delta is only ${(lastLog.deltaTime / 60).toFixed(2)}h`
    }
    return minutes
}
function updateLog(log: Log[], deductMinutes: number, userExternal: string, name: string, internalNote: string, justification: string): Log[] {

    if (log.length === 0) {
        throw new Error("Log is empty")
    }
    const lastLog = log[log.length - 1]

        const newDeltaTime = lastLog.deltaTime - deductMinutes
        return [...log.slice(0, -1), {
            ...lastLog,
            status: 2,
            timestamp: new Date().toISOString(),
            deltaTime: newDeltaTime,
            message: [...lastLog.message, { userExternal: userExternal, internalNote: internalNote, justification: justification, timestamp: new Date().toISOString(), reviewerName: name }],
            submmitedToHQ: false
        }]
   

}
export const POST: RequestHandler = async ({ request,cookies }) => {
    const adminJWTToken = cookies.get("admin_jwt")
    if (!adminJWTToken) {
        return error(401, "Unauthorized")
    }
    let decoded: AdminJWT
    try {
         decoded = jwt.verify(adminJWTToken, ADMIN_JWT_SECRET) as AdminJWT
        if (!decoded.isReviewer ) {
            return error(401, "Unauthorized")
        }
    } catch (err) {
        return error(401, "Unauthorized")
    }
    const {recordId, userExternal, internalNote, justification, decreaseTime} = await request.json()
    if (!recordId || !userExternal  || !justification ) {
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
    const log = projectData.fields.log
    const name = decoded.name
    const parsedLog = JSON.parse(log) as Log[]
    const deductMinutes = parseDeductionMinutes(decreaseTime, parsedLog.at(-1))
    if (typeof deductMinutes === "string") {
        return error(400, deductMinutes)
    }
    const updatedLog = updateLog(parsedLog, deductMinutes, userExternal, name, internalNote, justification)
    const [response, botResponse] = await Promise.all([
        patchProjectForShip(recordId, updatedLog, "rejected"),
        fetch("https://notifications.alchemize.hackclub.com/review-reject", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${BOT_AUTH}`
            },
            body: JSON.stringify(
            { "user_id": projectData.fields.slackId, "project_name": projectData.fields.Name, "project_link": projectData.fields.code ?? "", "reviewer_id": decoded.slackId, "feedback": userExternal }
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
                slackId: projectData.fields.slackId,
                projectName: projectData.fields.Name,
                projectLink: projectData.fields.code ?? ""
            })
                return new Response(JSON.stringify({ message: "Bot Failed to send notification", newLog: updatedLog }), { status: 207 })
    
        }
    return new Response(JSON.stringify({ message: "Log updated successfully", newLog: updatedLog }), { status: 200 })
}