import { error } from "@sveltejs/kit"
import jwt from "jsonwebtoken"
import { ADMIN_JWT_SECRET } from "$env/static/private"
import type { RequestHandler } from "./$types";
import type { Log,  AdminJWT, AdminProjectView, Address } from "$lib/types";
import { getProjectById, patchProjectForShip, addToJustifications } from "$lib/db";

const checkSubmittedToHQ = (log: Log[], justification: string): Log[] => {
    let newLog = log.map(entry => {
        if (entry.status === 1 && !entry.submmitedToHQ) {
            return { ...entry, submmitedToHQ: true }
        }
        return entry
    })
    newLog = [...newLog, {
    status: 1,
    timestamp: new Date().toISOString(),
    deltaTime: 0,
    message: [{ userExternal: "System Internal Message", internalNote: "Project sent to Unified", justification: justification, timestamp: new Date().toISOString(), reviewerName: "T2 System" }],
    submmitedToHQ: true
    }]
    return newLog
}
const parseAddress = (address: string) => {
    if(address === "") return {
        line_1: "",
        city: "",
        state: "",
        country: "",
        postal_code: ""
    } as Address
    
    return JSON.parse(address)[0] as Address
}
const calculateNewHours = (log: Log[]) => {
    let minsSpent = 0 
    log.forEach(entry => {
        if (entry.status === 1 && !entry.submmitedToHQ) {
            minsSpent += entry.deltaTime
        }
    })
    return Math.floor(minsSpent / 60)
}
export const POST: RequestHandler = async ({ request, cookies }) => {
        const adminJWTToken = cookies.get("admin_jwt")
        if (!adminJWTToken) {
            return error(401, "Unauthorized")
        }
        let decoded: AdminJWT
        try {
            decoded = jwt.verify(adminJWTToken, ADMIN_JWT_SECRET) as AdminJWT
            if (!decoded.isT2Reviewer) {
                return error(401, "Unauthorized")
            }
        } catch (err) {
            return error(401, "Unauthorized")
        }
        const {justification,subtraction, projectId} = await request.json()
        const projectResponse = await getProjectById(projectId)
        if (!projectResponse.ok) {
            return error(500, "Failed to fetch project")
        }
        const project = await projectResponse.json() as AdminProjectView
        const log = JSON.parse(project.fields.log) as Log[]
        const newLog = checkSubmittedToHQ(log, justification)
        const address = parseAddress(project.fields.address || "")
        
        const [patchResponse, sendToJustificationResponse] = await Promise.all([
            patchProjectForShip(projectId, newLog, "accepted"),
            addToJustifications({
            projectId,
            email: project.fields.owner,
            demo: project.fields.demo || "",
            code: project.fields.code || "",
            description: project.fields.description,
            screenshot: project.fields.screenshot,
            address: address.line_1 ?? "",
            city: address.city ?? "",
            state: address.state ?? "",
            country: address.country ?? "",
            zip: address.postal_code ?? "",
            birthdate: project.fields.birthdate || "",
            overrideHoursSpent: (calculateNewHours(log) - subtraction) + "",
            justification: justification,
            firstName: project.fields.firstName,
            lastName: project.fields.lastName
        })
        ])
       
        if (!patchResponse.ok) {
            return error(500, "Failed to update project status")
         }
        if (!sendToJustificationResponse.ok) {
            return error(500, "Failed to send justification")
        }
        return new Response(JSON.stringify({message: "Project sent to HQ successfully"}), {status: 200})
        
}