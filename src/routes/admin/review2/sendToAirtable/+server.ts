import { error } from "@sveltejs/kit"
import { BOT_AUTH } from "$env/static/private"
import { requireAdminApi } from "$lib/server/auth"
import type { RequestHandler } from "./$types";
import type { Log, AdminProjectView, Address } from "$lib/types";
import { getProjectById, addToJustifications, atomicShipProjectAndAward, TransactionAbort } from "$lib/db";
import { applyT2Award, calculateNewMinutes, hasUnpushedApprovedEntries, isOwnProject } from "$lib/server/projectLog";
import { formatAqua, hundredthsToUnits, minutesToHundredths } from "$lib/currency"
import { decryptAES, encryptAES } from "$lib/utils.server"
import { submitProjectToAirtable } from "$lib/airtable"
import crypto from "crypto"
// Hack Club Auth returns a list of addresses; ship to the one marked primary, not just the first
const pickShippingAddress = (decryptedAddresses: string): Address | null => {
    if (decryptedAddresses === "" || decryptedAddresses === "null") return null
    try {
        const addresses = JSON.parse(decryptedAddresses) as Address[]
        if (!Array.isArray(addresses) || addresses.length === 0) return null
        return addresses.find(address => address.primary) ?? addresses[0]
    } catch {
        return null
    }
}
const findGithubUsernameFromCodeUrl = (codeUrl: string): string | null => {
    const githubRegex = /https:\/\/github\.com\/([^\/]+)\/([^\/]+)/;
    const match = codeUrl.match(githubRegex);
    return match ? match[1] : null;
}
export const POST: RequestHandler = async ({ request, locals }) => {
    const decoded = requireAdminApi(locals, "t2_reviewer")
    const body = await request.json()
    const { justification, projectId } = body
    // The optional "Deduct Hours" input is sent as null when left empty
    const subtraction = body.subtraction ?? 0
    if (typeof subtraction !== "number" || !Number.isFinite(subtraction) || subtraction < 0) {
        return error(400, "Deducted hours must be a non-negative number")
    }
    if (typeof justification !== "string") {
        return error(400, "Justification is required")
    }
    const projectIdNum = Number(projectId)
    if (!Number.isInteger(projectIdNum) || projectIdNum <= 0) {
        return error(400, "Invalid project id")
    }
    const projectResponse = await getProjectById(String(projectIdNum))
    if (!projectResponse.ok) {
        return error(500, "Failed to fetch project")
    }
    const project = await projectResponse.json() as AdminProjectView
    if (isOwnProject(decoded, project.fields)) {
        return error(403, "You can't review or pay out your own project")
    }
    const log = JSON.parse(project.fields.log || "[]") as Log[]
    if (!hasUnpushedApprovedEntries(log)) {
        return error(400, "Project has not been approved or all logs are submitted to HQ")
    }
    const address = pickShippingAddress(decryptAES(project.fields.address, project.fields.iv))
    const iv = crypto.randomBytes(16)
    const decryptedBirthdate = decryptAES(project.fields.birthdate, project.fields.iv)
    const decryptedFirstName = decryptAES(project.fields.firstName, project.fields.iv)
    const decryptedLastName = decryptAES(project.fields.lastName, project.fields.iv)
    // Unified needs a real address, birthday and name; refuse instead of submitting blanks
    if (!address || !address.line_1 || !address.city || !address.country) {
        return error(400, "The owner has no complete address on Hack Club Auth. Ask them to add one there and log in to Alchemize again")
    }
    if (decryptedBirthdate === "" || decryptedBirthdate === "null" || decryptedFirstName === "") {
        return error(400, "The owner's birthday or name is missing on Hack Club Auth. Ask them to add it there and log in to Alchemize again")
    }

    // Everything that moves currency happens under the project + owner row locks: the log is re-read and
    // re-validated there, Unified is contacted there, and the award is only committed if all of it succeeds.
    // 1 approved hour = 1 Aqua Regia, credited to the hundredth; Unified receives the same number of hours.
    let awardedHundredths = 0
    const shipResult = await atomicShipProjectAndAward(projectIdNum, async (locked) => {
        if (!hasUnpushedApprovedEntries(locked.log)) {
            throw new TransactionAbort(400, "All approved logs are already submitted to HQ")
        }
        const approvedMinutes = calculateNewMinutes(locked.log)
        const deductedMinutes = Math.round(subtraction * 60)
        if (deductedMinutes > approvedMinutes) {
            throw new TransactionAbort(400, `Cannot deduct ${subtraction}h, only ${(approvedMinutes / 60).toFixed(2)}h are approved in this review`)
        }
        awardedHundredths = minutesToHundredths(approvedMinutes - deductedMinutes)

        const airtableResponse = await submitProjectToAirtable({
            githubUsername: findGithubUsernameFromCodeUrl(project.fields.code || "") ?? "",
            email: locked.owner,
            playableUrl: project.fields.demo || "",
            codeUrl: project.fields.code || "",
            description: project.fields.description,
            screenshot: [project.fields.screenshot, project.fields.screenshot2].filter(Boolean),
            address1: address.line_1,
            city: address.city,
            state: address.state,
            country: address.country,
            zip: address.postal_code,
            birthday: decryptedBirthdate,
            overrideHoursSpent: hundredthsToUnits(awardedHundredths),
            overrideHoursJustification: justification,
            firstName: decryptedFirstName,
            lastName: decryptedLastName
        })
        if (!airtableResponse.ok) {
            console.error("Failed to send project to Airtable:", {
                status: airtableResponse.status,
                statusText: airtableResponse.statusText,
                timestamp: new Date().toISOString(),
                projectId: project.id,
                slackId: project.fields.slackId,
                projectName: project.fields.Name,
                projectLink: project.fields.code,
            })
            throw new TransactionAbort(500, "Failed to send project to Airtable")
        }

        return {
            newLog: applyT2Award(locked.log, justification, decoded.name),
            amountHundredths: awardedHundredths,
            remarks: `Added ${formatAqua(awardedHundredths)} for project approval`
        }
    })
    if (!shipResult.ok) {
        return error(shipResult.status as any, (await shipResult.json()).message)
    }
    const { newLog } = await shipResult.json()

    const [sendToJustificationResponse, botResponse] = await Promise.all([
        addToJustifications({
            name: project.fields.Name,
            projectId: String(projectIdNum),
            email: project.fields.owner,
            demo: project.fields.demo || "",
            code: project.fields.code || "",
            description: project.fields.description,
            screenshot: project.fields.screenshot,
            screenshot2: project.fields.screenshot2 || "",
            address: encryptAES(address.line_1 ?? "").finalString,
            city: encryptAES(address.city ?? "").finalString,
            state: encryptAES(address.state ?? "").finalString,
            country: encryptAES(address.country ?? "").finalString,
            zip: encryptAES(address.postal_code ?? "").finalString,
            birthdate: encryptAES(decryptedBirthdate).finalString,
            overrideHoursSpent: hundredthsToUnits(awardedHundredths) + "",
            justification: justification,
            firstName: encryptAES(decryptedFirstName).finalString,
            lastName: encryptAES(decryptedLastName).finalString,
            // Per-field IVs are embedded in each ciphertext above; this legacy
            // column is retained only for decrypting older rows.
            iv: iv.toString('hex')
        }),
        fetch("https://notifications.alchemize.hackclub.com/review-accept", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${BOT_AUTH}`
            },
            body: JSON.stringify(
                { "user_id": project.fields.slackId, "project_name": project.fields.Name, "project_link": project.fields.code, "reviewer_id": decoded.slackId, "feedback": log.at(-1)?.message.at(-1)?.userExternal || "", "currencies": formatAqua(awardedHundredths) }
            )
        })
    ])

    // Currency is already committed at this point; a retry is safe because the logs are marked as pushed
    if (!sendToJustificationResponse.ok) {
        return error(500, "Project shipped and currency awarded, but failed to save justification")
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
    return new Response(JSON.stringify({ message: "Project sent to HQ successfully" }), { status: 200 })

}
