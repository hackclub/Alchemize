import type { Log, UserCurrency, AdminJWT } from "$lib/types";
import { AIRTABLE, AIRTABLE_CLIENT, THEME_MAPS_TO_CURRENCY , ADMIN_JWT_SECRET} from "$env/static/private"
import {themeCurrencyMaps} from "$lib/themeCurrencyMaps"
import type { RequestHandler } from "./$types";
import {error} from "@sveltejs/kit"
import jwt from "jsonwebtoken"

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
    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_CLIENT}/Users?filterByFormula={email}='${encodeURIComponent(userEmailId)}'`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${AIRTABLE}`,

            "Content-Type": "application/json",

        }
    })
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
    const updateResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_CLIENT}/Users/${userRecord.id}`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${AIRTABLE}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            fields: {
                currency: JSON.stringify(currentCurrency)
            }
        }),
    })
    if (!updateResponse.ok) {
        const errorData = await updateResponse.json()
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

    const { recordId, log, userExternal, internalNote, justification, decreaseTime, userEmailId, theme} = await request.json()
    if (!recordId || !log || !userExternal || !internalNote || !justification || !userEmailId || !theme) {
        return new Response("Missing required fields", { status: 400 })
    }
    const oldLog = JSON.parse(log) as Log[]
    const [newLog, newDeltaTime] = updateLog(oldLog, -decreaseTime, userExternal, approver, internalNote, justification)
    const logJson = JSON.stringify(newLog)
    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_CLIENT}/Projects/${recordId}`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${AIRTABLE}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            fields: {
                log: logJson,
                status: "accepted"
            }
        }),
    })
    if (!response.ok) {
        const errorData = await response.json()
        console.error("Failed to update project log:", {
            status: response.status,
            error: errorData,
            timestamp: new Date().toISOString()
        })
        return new Response("Failed to update project log", { status: 500 })
    }
    try {
        const currencyType = themeToKeys(theme)
        await updateUserCurrency(Math.floor(newDeltaTime/60), userEmailId, currencyType)
    } catch (err) {
        console.error("Failed to update user currency:", {
            error: err instanceof Error ? err
                .message : String(err),
            timestamp: new Date().toISOString()
        })
        throw new Error("Failed to update user currency. Dm @TheUtkarsh8939 on Slack to resolve this issue and tell him to trigger user autogen")

    }
    return new Response(JSON.stringify({ message: "Project accepted and user currency updated successfully", newLog: newLog }), { status: 200 })

}