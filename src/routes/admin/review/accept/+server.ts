import type { Log, AdminJWT, AirtableProject } from "$lib/types";
import { ADMIN_JWT_SECRET } from "$env/static/private"
import type { RequestHandler } from "./$types";
import { error } from "@sveltejs/kit"
import jwt from "jsonwebtoken"
import { getProjectById, patchProjectForShip } from "$lib/db";

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
function updateLog(log: Log[], deductMinutes: number, userExternal: string, name: string, internalNote: string, justification: string): [Log[], number] {

    if (log.length === 0) {
        throw new Error("Log is empty")
    }
    const lastLog = log[log.length - 1]

    const newDeltaTime = lastLog.deltaTime - deductMinutes
    return [[...log.slice(0, -1), {
        ...lastLog,
        status: 1,
        timestamp: new Date().toISOString(),
        deltaTime: newDeltaTime,
        message: [...lastLog.message, { userExternal: userExternal, internalNote: internalNote, justification: justification, timestamp: new Date().toISOString(), reviewerName: `APPROVED ${name}` }],
        submmitedToHQ: false
    }], newDeltaTime]


}

//@ts-ignore

export const POST: RequestHandler = async ({ request, cookies }) => {
    const adminJWTToken = cookies.get("admin_jwt")
    if (!adminJWTToken) {
        return error(401, "Unauthorized")
    }
    let decoded: AdminJWT
    try {
        decoded = jwt.verify(adminJWTToken, ADMIN_JWT_SECRET) as AdminJWT
        if (!decoded.isReviewer) {
            return error(401, "Unauthorized")
        }
    } catch (err) {
        return error(401, "Unauthorized")
    }
    const approver = decoded.name

    const { recordId, userExternal, internalNote, justification, decreaseTime } = await request.json()
    if (!recordId || !userExternal || !justification ) {
        return new Response("Missing required fields", { status: 400 })
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
    const oldLog = JSON.parse(log) as Log[]
    const deductMinutes = parseDeductionMinutes(decreaseTime, oldLog.at(-1))
    if (typeof deductMinutes === "string") {
        return error(400, deductMinutes)
    }
    const [newLog, newDeltaTime] = updateLog(oldLog, deductMinutes, userExternal, approver, internalNote, justification)


    const [response] = await Promise.all([
        patchProjectForShip(recordId, newLog, "accepted"),



    ])
    if (!response.ok) {
        const errorData = await response.json()
        console.error("Failed to update project log:", {
            status: response.status,
            error: errorData,
            timestamp: new Date().toISOString()
        })
        return new Response("Failed to update project log", { status: 500 })
    }




    return new Response(JSON.stringify({ message: "Project accepted", newLog: newLog }), { status: 200 })

}