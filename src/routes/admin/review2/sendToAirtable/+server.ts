import { error } from "@sveltejs/kit"
import { BOT_AUTH } from "$env/static/private"
import { requireAdminApi } from "$lib/server/auth"
import type { RequestHandler } from "./$types";
import type { Log, AdminProjectView, Address } from "$lib/types";
import { getProjectById, addToJustifications, beginUnifiedSubmission, completeUnifiedSubmission, markUnifiedSubmissionFailed } from "$lib/db";
import { hasUnpushedApprovedEntries, isOwnProject } from "$lib/server/projectLog";
import { formatAqua, hundredthsToUnits } from "$lib/currency"
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

    // Three phases, so no row lock is held while Airtable is called and an attempt with an unknown outcome
    // can never be retried blindly (which would create a duplicate Unified record):
    //   1. record a "started" attempt with the award amount (beginUnifiedSubmission)
    //   2. submit to Airtable
    //   3. mark the entries as sent to HQ, credit the owner and close the attempt, atomically (completeUnifiedSubmission)
    // If an earlier attempt never finished, the reviewer must check Airtable and say whether the record exists.
    const resolveInDoubt = body.resolveInDoubt as unknown
    if (resolveInDoubt !== undefined && resolveInDoubt !== "already_in_airtable" && resolveInDoubt !== "not_in_airtable") {
        return error(400, "Invalid resolveInDoubt value")
    }
    const deductedMinutes = Math.round(subtraction * 60)
    const awardAndClose = async (submissionId: number, airtableRecordId: string | null) =>
        completeUnifiedSubmission(submissionId, justification, airtableRecordId)

    let completed: Awaited<ReturnType<typeof completeUnifiedSubmission>>
    let awardedHundredths: number
    let begun = await beginUnifiedSubmission(projectIdNum, deductedMinutes, { slackId: decoded.slackId, name: decoded.name })
    if (!begun.ok && begun.inFlight && resolveInDoubt === "not_in_airtable") {
        await markUnifiedSubmissionFailed(begun.inFlight.id, `${decoded.name} confirmed the record is not in Airtable`)
        begun = await beginUnifiedSubmission(projectIdNum, deductedMinutes, { slackId: decoded.slackId, name: decoded.name })
    }
    if (!begun.ok && begun.inFlight && resolveInDoubt === "already_in_airtable") {
        // The record exists in Airtable: finish the award for the earlier attempt without submitting again
        console.info(`Unified submission ${begun.inFlight.id} for project ${projectIdNum}: ${decoded.name} confirmed the Airtable record exists`)
        awardedHundredths = begun.inFlight.amountHundredths
        completed = await awardAndClose(begun.inFlight.id, null)
        if (!completed.ok) {
            return error(completed.status as any, (await completed.json()).message)
        }
    } else {
        if (!begun.ok) {
            if (begun.inFlight) {
                return new Response(JSON.stringify({
                    code: "SUBMISSION_IN_DOUBT",
                    message: `An earlier submission of this project to Unified (started ${new Date(begun.inFlight.startedAt).toISOString()} by ${begun.inFlight.reviewerName}) did not finish. Check whether the project is already in Airtable before continuing.`,
                }), { status: 409, headers: { "Content-Type": "application/json" } })
            }
            return error(begun.status as any, begun.message)
        }
        const submission = begun.submission
        awardedHundredths = submission.amountHundredths

        let airtableResponse: Awaited<ReturnType<typeof submitProjectToAirtable>>
        try {
            airtableResponse = await submitProjectToAirtable({
                githubUsername: findGithubUsernameFromCodeUrl(project.fields.code || "") ?? "",
                email: project.fields.owner,
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
        } catch (err) {
            // Timeout or network error: Airtable may or may not have created the record, so the attempt stays open
            console.error(`Unified submission ${submission.id} for project ${projectIdNum}: outcome unknown`, err)
            return error(502, "Airtable did not answer in time, so it's unknown whether the project was submitted. Check Airtable, then press push again to resolve it.")
        }
        if (!airtableResponse.ok) {
            console.error("Failed to send project to Airtable:", {
                status: airtableResponse.status,
                statusText: airtableResponse.statusText,
                timestamp: new Date().toISOString(),
                projectId: project.id,
                submissionId: submission.id,
            })
            // A 4xx means Airtable rejected the request and created nothing; a 5xx leaves the outcome unknown
            if (airtableResponse.status >= 400 && airtableResponse.status < 500) {
                await markUnifiedSubmissionFailed(submission.id, `Airtable answered ${airtableResponse.status}`)
                return error(502, `Airtable rejected the submission (${airtableResponse.status}), nothing was awarded. Please try again or report it.`)
            }
            return error(502, "Airtable returned an error, so it's unknown whether the project was submitted. Check Airtable, then press push again to resolve it.")
        }

        completed = await awardAndClose(submission.id, airtableResponse.json?.id ?? null)
        if (!completed.ok) {
            // Airtable has the record but the award didn't commit; the open attempt makes the next push ask the reviewer
            console.error(`Unified submission ${submission.id} for project ${projectIdNum} was accepted by Airtable but the award failed`)
            return error(completed.status as any, `${(await completed.json()).message}. The project IS in Airtable: press push again and confirm it's already there to record the award.`)
        }
    }
    const { newLog } = await completed.json()

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
