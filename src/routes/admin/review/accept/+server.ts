import type { Log, UserCurrency, AdminJWT, AirtableProject } from "$lib/types";
import { ADMIN_JWT_SECRET, BOT_AUTH } from "$env/static/private"
import { themeCurrencyMaps } from "$lib/themeCurrencyMaps"
import type { RequestHandler } from "./$types";
import { error } from "@sveltejs/kit"
import jwt from "jsonwebtoken"
import { addLedgerEntry, getProjectById, getUserByEmail, patchProjectForShip, patchUserCurrency } from "$lib/db";

function updateLog(log: Log[], deltaTime: number, userExternal: string, name: string, internalNote: string, justification: string): [Log[], number] {

    if (log.length === 0) {
        throw new Error("Log is empty")
    }
    const lastLog = log[log.length - 1]

    const newDeltaTime = lastLog.deltaTime - deltaTime
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
    const [newLog, newDeltaTime] = updateLog(oldLog, -decreaseTime, userExternal, approver, internalNote, justification)


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




    return new Response(JSON.stringify({ message: "Project accepted and user currency updated successfully", newLog: newLog }), { status: 200 })

}