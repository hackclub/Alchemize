import { error } from "@sveltejs/kit"
import jwt from "jsonwebtoken"
import { ADMIN_JWT_SECRET } from "$env/static/private"
import type { RequestHandler } from "@sveltejs/kit"
import type { AdminJWT } from "$lib/types"
import { getLatestJustificationByProjectId } from "$lib/db"

export const POST: RequestHandler = async ({ request, cookies }) => {
    const adminJWTToken = cookies.get("admin_jwt")
    if (!adminJWTToken) {
        return error(401, "Unauthorized")
    }
    try {
        const decoded = jwt.verify(adminJWTToken, ADMIN_JWT_SECRET) as AdminJWT
        if (!decoded.isT2Reviewer) {
            return error(401, "Unauthorized")
        }
    } catch (err) {
        return error(401, "Unauthorized")
    }
    const { projectId } = await request.json()
    if (!projectId) {
        return error(400, "Missing projectId")
    }
    const justificationResponse = await getLatestJustificationByProjectId(projectId + "")
    if (!justificationResponse.ok) {
        return error(404, "No stored justification found for this project")
    }
    const record = (await justificationResponse.json()).records[0]
    return new Response(JSON.stringify({
        justification: record.fields.justification,
        overrideHoursSpent: record.fields.overrideHoursSpent,
        name: record.fields.name,
    }), { status: 200 })
}
