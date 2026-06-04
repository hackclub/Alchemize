import type { Log, UserCurrency, AdminJWT } from "$lib/types";
import { ADMIN_JWT_SECRET, BOT_AUTH } from "$env/static/private"
import { themeCurrencyMaps } from "$lib/themeCurrencyMaps"
import type { RequestHandler } from "./$types";
import { error } from "@sveltejs/kit"
import jwt from "jsonwebtoken"
import { getUserByEmail, patchProjectForShip, patchUserCurrency } from "$lib/db";

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
        message: [...lastLog.message, { userExternal: userExternal, internalNote: internalNote, justification: justification, timestamp: new Date().toISOString(), reviewerName: name }],
        submmitedToHQ: false
    }], newDeltaTime]


}
async function updateUserCurrency(amount: number, userEmailId: string, currencyType: keyof UserCurrency) {
    const response = await getUserByEmail(userEmailId)
    if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to fetch user: ${errorData.error.message}`)
    }
    const data = await response.json()
    if (data.records.length === 0) {
        throw new Error("User not found")
    }

    const userRecord = data.records[0]
    const currentCurrency = JSON.parse(userRecord.fields.currency) || {} as UserCurrency
    currentCurrency[currencyType] = (currentCurrency[currencyType] || 0) + amount
    const updateResponse = await patchUserCurrency(userRecord.fields.email, currentCurrency)
    if (!updateResponse.ok) {
        const errorData = await updateResponse.json()
        console.error("Failed to update user currency:", {
            status: updateResponse.status,
            error: errorData,
            timestamp: new Date().toISOString()
        })
        throw new Error(`Failed to update user currency: ${errorData.error.message}`)
    }
}
const themeToKeys = (theme: string): keyof UserCurrency => {
    const themeMap = themeCurrencyMaps as Record<string, keyof UserCurrency>
    return themeMap[theme]
};
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

    const { recordId, log, userExternal, internalNote, justification, decreaseTime, userEmailId, theme, slackId, projectName, projectLink } = await request.json()
    if (!recordId || !log || !userExternal || !justification || !userEmailId || !theme || !slackId || !projectName || !projectLink) {
        return new Response("Missing required fields", { status: 400 })
    }
    const oldLog = JSON.parse(log) as Log[]
    const [newLog, newDeltaTime] = updateLog(oldLog, -decreaseTime, userExternal, approver, internalNote, justification)
    const logJson = JSON.stringify(newLog)
    const response = await patchProjectForShip(recordId, newLog, "accepted")
    if (!response.ok) {
        const errorData = await response.json()
        console.error("Failed to update project log:", {
            status: response.status,
            error: errorData,
            timestamp: new Date().toISOString()
        })
        return new Response("Failed to update project log", { status: 500 })
    }
    const currencyType = themeToKeys(theme)
    try {
        await updateUserCurrency(Math.floor(newDeltaTime / 60), userEmailId, currencyType)
    } catch (err) {
        console.error("Failed to update user currency:", {
            error: err instanceof Error ? err
                .message : String(err),
            timestamp: new Date().toISOString()
        })
        throw new Error("Failed to update user currency. Dm @TheUtkarsh8939 on Slack to resolve this issue and tell him to trigger user autogen")

    }
    const botResponse = await fetch("https://aoishik.qzz.io/review-accept", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${BOT_AUTH}`
        },
        body: JSON.stringify(
        { "user_id": slackId, "project_name": projectName, "project_link": projectLink, "reviewer_id": approver, "feedback": userExternal, "currencies": `${Math.floor(newDeltaTime / 60)} ${currencyType}` }
        )
    })
    if (!botResponse.ok) {
        console.warn(`Failed to send notification to bot for record ${recordId}:`, {
            status: botResponse.status,
            statusText: botResponse.statusText,
            timestamp: new Date().toISOString(),
            slackId: slackId,
            projectName: projectName,
            projectLink: projectLink
        })
            return new Response(JSON.stringify({ message: "Bot Failed to send notification", newLog: newLog }), { status: 207 })

    }
    return new Response(JSON.stringify({ message: "Project accepted and user currency updated successfully", newLog: newLog }), { status: 200 })

}