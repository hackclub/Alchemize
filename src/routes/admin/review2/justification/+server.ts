import { error } from "@sveltejs/kit"
import { requireAdminApi } from "$lib/server/auth"
import type { RequestHandler } from "@sveltejs/kit"
import { getLatestJustificationByProjectId } from "$lib/db"

export const POST: RequestHandler = async ({ request, locals }) => {
    requireAdminApi(locals, "t2_reviewer")
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
