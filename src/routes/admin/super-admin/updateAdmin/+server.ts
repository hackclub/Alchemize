import type { RequestHandler } from "@sveltejs/kit"
import {upsertAdmin} from "$lib/db"
import {WebClient} from "@slack/web-api"
import { SLACK_BOT_TOKEN } from "$env/static/private"
import { SLACK_USER_ID_PATTERN } from "$lib/roles"
import { requireAdminApi } from "$lib/server/auth"
const webClient = new WebClient(SLACK_BOT_TOKEN)
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const rolesToRoleString = (isReviewer:boolean, isSuperAdmin:boolean, isFulfiller:boolean, isT2Reviewer:boolean, isShopManager:boolean) => {
    let roles = ""
    if (isReviewer) roles += "reviewer,"
    if (isSuperAdmin) roles += "super_admin,"
    if (isFulfiller) roles += "fulfiller,"
    if (isT2Reviewer) roles += "t2_reviewer,"
    if (isShopManager) roles += "shop_manager,"
    return roles
}
const getUserName = async (userId:string) => {
    try {
        const result = await webClient.users.info({ user: userId });
        return result.user?.profile?.display_name || "Unknown User";
    }
    catch (error) {
        console.error("Error fetching user info from Slack:", error);
        return "Unknown User";
    }
}
const badRequest = (error: string) => new Response(JSON.stringify({ ok: false, error }), { status: 400 })
export const POST: RequestHandler = async ({request, locals}) => {
    requireAdminApi(locals, "super_admin")
    let data: Record<string, unknown>
    try {
        data = await request.json()
    } catch {
        return badRequest("Invalid JSON body")
    }
    const {email, isReviewer, isSuperAdmin, isFulfiller, isT2Reviewer, isShopManager, nda} = data
    const slackId = typeof data.slackId === "string" ? data.slackId.trim() : ""
    if (typeof email !== "string" || !EMAIL_PATTERN.test(email.trim())) {
        return badRequest("A valid email is required")
    }
    // Admin login matches on Slack ID, so every admin row must carry a real one
    if (!SLACK_USER_ID_PATTERN.test(slackId)) {
        return badRequest("A valid Slack user ID is required (it starts with U, e.g. U01ABCDEF)")
    }
    const flags = [isReviewer, isSuperAdmin, isFulfiller, isT2Reviewer, isShopManager, nda]
    if (!flags.every(flag => typeof flag === "boolean")) {
        return badRequest("Role and NDA flags must be booleans")
    }
    const roles = rolesToRoleString(isReviewer as boolean, isSuperAdmin as boolean, isFulfiller as boolean, isT2Reviewer as boolean, isShopManager as boolean)
    const name = await getUserName(slackId)
    const result = await upsertAdmin(slackId, email.trim(), roles, name, String(nda))
    return new Response(JSON.stringify({ok: result.ok}), {status: result.ok ? 200 : 500})
}
