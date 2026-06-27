import { error } from "@sveltejs/kit"
import jwt from "jsonwebtoken"
import { ADMIN_JWT_SECRET, BOT_AUTH } from "$env/static/private"
import type { RequestHandler } from "./$types";
import type { Log,  AdminJWT, AdminProjectView, Address, UserCurrency } from "$lib/types";
import { getProjectById, patchProjectForShip, addToJustifications, getUserByEmail, patchUserCurrency, addLedgerEntry} from "$lib/db";
import {themeCurrencyMaps} from "$lib/themeCurrencyMaps"
import {decryptAES, encryptAES} from "$lib/utils.server"
import crypto from "crypto"
const checkSubmittedToHQ = (log: Log[], justification: string, reviewerName: string): Log[] => {
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
    message: [{ userExternal: "Currency Awarded", internalNote: "Project sent to Unified", justification: justification, timestamp: new Date().toISOString(), reviewerName: "T2 "+reviewerName }],
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
    const [updateResponse, ledgerResp] = await Promise.all([patchUserCurrency(userRecord.fields.email, currentCurrency), addLedgerEntry({
        email: userRecord.fields.email,
        slackId: userRecord.fields.slackId,
        sign: true,
        amount: amount,
        currencyType: currencyType,
        reason: "review-accept",
        remarks: `Added ${amount} ${currencyType} for project approval`
    })])
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
const calculateNewHours = (log: Log[]) => {
    let minsSpent = 0 
    log.forEach(entry => {
        if (entry.status === 1 && !entry.submmitedToHQ) {
            minsSpent += entry.deltaTime
        }
    })
    return Math.floor(minsSpent / 60)
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
        const newLog = checkSubmittedToHQ(log, justification, decoded.name)
        const decrytedAddress = decryptAES(project.fields.address, project.fields.encryptionIv)
        console.log("Decrypted Address:", decrytedAddress) // Debugging line to check the decrypted address
        const address = parseAddress(decrytedAddress || "")
        const iv = crypto.randomBytes(16)   
    const currencyType = themeToKeys(project.fields.Theme)
        const [patchResponse, sendToJustificationResponse, updateUserCurrencyResponse, botResponse] = await Promise.all([
            patchProjectForShip(projectId, newLog, "accepted_t2"),
            addToJustifications({
                name: project.fields.Name,
                projectId,
                email: project.fields.owner,
                demo: project.fields.demo || "",
                code: project.fields.code || "",
                description: project.fields.description,
                screenshot: project.fields.screenshot,
                address: encryptAES(address.line_1 ?? "", iv).finalString,
                city: encryptAES(address.city ?? "", iv).finalString,
                state: encryptAES(address.state ?? "", iv).finalString,
                country: encryptAES(address.country ?? "", iv).finalString,
                zip: encryptAES(address.postal_code ?? "", iv).finalString,
                birthdate: encryptAES(decryptAES(project.fields.birthdate, project.fields.encryptionIv), iv).finalString,
                overrideHoursSpent: (calculateNewHours(log) - subtraction) + "",
            justification: justification,
            firstName: encryptAES(decryptAES(project.fields.firstName, project.fields.encryptionIv), iv).finalString,
            lastName: encryptAES(decryptAES(project.fields.lastName, project.fields.encryptionIv), iv).finalString,
            iv: iv.toString('hex')
        }),
                updateUserCurrency((calculateNewHours(log) - subtraction), project.fields.owner, currencyType),
                fetch("https://aoishik.qzz.io/review-accept", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${BOT_AUTH}`
                    },
                    body: JSON.stringify(
                        { "user_id": project.fields.slackId, "project_name": project.fields.Name, "project_link": project.fields.code, "reviewer_id": "U0B18V07GQ3", "feedback": log.at(-1)?.message.at(-1)?.userExternal || "", "currencies": `${calculateNewHours(log) - subtraction} ${currencyType}` }
                    )
                })
        ])
       
        if (!patchResponse.ok) {
            return error(500, "Failed to update project status")
         }
        if (!sendToJustificationResponse.ok) {
            return error(500, "Failed to send justification")
        }
            if (!botResponse.ok) {
        console.warn(`Failed to send notification to bot for record ${project.id}:`, {
            status: botResponse.status,
            statusText: botResponse.statusText,
            timestamp: new Date().toISOString(),
            slackId: project.fields.slackId,
            projectName: project.fields.Name,
            projectLink: project.fields.code
        })
        return new Response(JSON.stringify({ message: "Bot Failed to send notification", newLog: newLog }), { status: 207 })

    }
        return new Response(JSON.stringify({message: "Project sent to HQ successfully"}), {status: 200})
        
}