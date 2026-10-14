import { getAdminByEmail } from '$lib/db'
import type { PageServerLoad } from './$types'
import { SLACK_BOT_TOKEN } from "$env/static/private"
import { WebClient } from "@slack/web-api"
import { requireAdminPage } from "$lib/server/auth"
import { hasRole } from "$lib/roles"

const slackClient = new WebClient(SLACK_BOT_TOKEN)
async function getUserName(userId: string) {
    try {
        const result = await slackClient.users.info({ user: userId });

        return result.user?.profile?.display_name || "Unknown User";
    } catch (error) {
        return "Unknown User"
    }
}
export const load: PageServerLoad = async ({ params, locals }) => {
    requireAdminPage(locals, "super_admin")

        let email = params.id
    let adminRes = await getAdminByEmail(email)
    let adminData = await adminRes.json()
    if (!adminRes.ok || !adminData.records || adminData.records.length === 0) {
        return {
            slackName: "Unknown User",

            slackId: "",
            email: email,
            isReviewer: false,
            isSuperAdmin: false,
            isFulfiller: false,
            isT2Reviewer: false,
            isShopManager: false,
        }
    }
    let roles = adminData.records[0].fields.roles || ""
    return {
        slackName: await getUserName(adminData.records[0].fields.slackId),
        slackId: adminData.records[0].fields.slackId,
        email: adminData.records[0].fields.email,
        isReviewer: hasRole(roles, "reviewer"),
        isSuperAdmin: hasRole(roles, "super_admin"),
        isFulfiller: hasRole(roles, "fulfiller"),
        isT2Reviewer: hasRole(roles, "t2_reviewer"),
        isShopManager: hasRole(roles, "shop_manager"),
        nda: adminData.records[0].fields.nda === "true"
    }
}