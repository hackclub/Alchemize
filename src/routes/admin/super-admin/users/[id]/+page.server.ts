import {getAdminByEmail} from '$lib/db'
import type { PageServerLoad } from './$types'
import jwt from "jsonwebtoken"
import {ADMIN_JWT_SECRET, SLACK_BOT_TOKEN} from "$env/static/private"
import { redirect } from "@sveltejs/kit"
import { WebClient } from "@slack/web-api"

const slackClient = new WebClient(SLACK_BOT_TOKEN)
async function getUserName(userId:string) {
  const result = await slackClient.users.info({ user: userId });
  
  return result.user?.profile?.display_name || "Unknown User"; 
}
export const load: PageServerLoad = async ({params, cookies}) => {

        let email = params.id
        let adminRes = await getAdminByEmail(email)
        let adminData = await adminRes.json()
        console.log("AdminRes:", adminData, "Param email:", email)
        if (!adminRes.ok || !adminData.records || adminData.records.length === 0) {
            return{
            slackName: "Unknown User",

                slackId: "",
                email: email,
                isReviewer: false,
                isSuperAdmin: false,
                isFulfiller: false,
                isT2Reviewer: false,

            }
        }
        let roles = adminData.records[0].fields.roles || ""
        return {
            slackName: await getUserName(adminData.records[0].fields.slackId),
            slackId: adminData.records[0].fields.slackId,
            email: adminData.records[0].fields.email,
            isReviewer: roles.includes("reviewer"),
            isSuperAdmin: roles.includes("super_admin"),
            isFulfiller: roles.includes("fulfiller"),
            isT2Reviewer: roles.includes("t2_reviewer"),
            nda: adminData.records[0].fields.nda === "true"
        }
}