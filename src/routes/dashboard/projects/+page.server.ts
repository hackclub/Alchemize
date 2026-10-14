import type { Actions, PageServerLoad } from "./$types"
import crypto from "crypto"
import { env } from "$env/dynamic/private"
import { getDataFromAccessToken, hackatimeAuthUrl } from "$lib/utils"
import { encryptAES, filterLogs } from "$lib/utils.server"
import {
	getProjectsByOwner,
	createProject,
	updateProject,
	getHackatimeTokenByEmail,
	getProjectForEdit,
	findHackatimeConflicts,
} from "$lib/db"
import { isHttpUrl } from "$lib/urls"
import type {
	AirtableProject,
	AirtableProjectWithPII,
	UserAuthToken,
} from "$lib/types"
import { fail, redirect } from "@sveltejs/kit"
import { requireUserApi, requireUserPage } from "$lib/server/auth"
async function uploadScreenshot(file?: File): Promise<string> {
	if (!file || file.size === 0) return ""

	const body = new FormData()
	body.append("file", file)

	const response = await fetch("https://cdn.hackclub.com/api/v4/upload", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${env.CDN_UPLOAD_SECRET}`,
		},
		body,
	})

	if (!response.ok) {
		const errorData = await response.json()

		const errorCode = errorData.error?.type ?? "UNKNOWN_ERROR"
		const errorText =
			errorData.error?.message ??
			"An error occurred while uploading the screenshot"

		console.error("CDN upload failed:", {
			status: response.status,
			errorCode,
			errorText,
			timestamp: new Date().toISOString(),
		})

		throw new Error(
			`Screenshot upload failed: ${errorText}. Please notify TheUtkarsh8939 on Slack with the error code: ${errorCode}`
		)
	}

	return (await response.json()).url
}
// Checks shared by create and update; returns an error message for the user, or null
const validateProjectLinks = (demo: string | null, code: string | null): string | null => {
	if ((demo && !isHttpUrl(demo)) || (code && !isHttpUrl(code))) {
		return "The demo and repository links must be http(s) URLs"
	}
	return null
}
const hackatimeConflictMessage = (conflicts: { Name: string }[]) =>
	`That Hackatime project is already linked to your project "${conflicts[0].Name}". Each Hackatime project can only be submitted under one Alchemize project.`
const isInReview = (status: string) => status.startsWith("pending") || status === "accepted"

export const actions = {
	create: async event => {
		const data = requireUserApi(event.locals)

		const email = data.email
		const slackId = data.slack_id
		const formData = await event.request.formData()
		const projectName = formData.get("name") as string
		const projectDescription = formData.get("description") as string
		const projectType = formData.get("type") as string
		const projectUrl = formData.get("demo") as string
		const projectCode = formData.get("github") as string
		const oldProject = formData.get("projectUpdate") as string
		const hackatimeProject = formData.get("hackatime") as string
		const theme = formData.get("theme") as string
		const screenshot = formData.get("screenshot") as File
		const screenshot2 = formData.get("screenshot-2") as File
		const linkError = validateProjectLinks(projectUrl, projectCode)
		if (linkError) {
			return fail(400, { message: linkError })
		}
		if (hackatimeProject) {
			const conflicts = await findHackatimeConflicts(email, hackatimeProject)
			if (conflicts.length > 0) {
				return fail(400, { message: hackatimeConflictMessage(conflicts) })
			}
		}
		const [url, url2] = await Promise.all([
			uploadScreenshot(screenshot),
			uploadScreenshot(screenshot2),
		])
		const response = await createProject({
			Name: projectName,
			description: projectDescription ?? "",
			type: projectType ?? "",
			demo: projectUrl ?? "",
			code: projectCode ?? "",
			status: "unshipped",
			log: "",
			hackatime: hackatimeProject ?? "",
			languages: "",
			update: oldProject,
			journals: "",
			owner: email,
			Theme: theme ?? "",
			address: "redact",
			birthdate: "redact",
			slackId: slackId,
			firstName: "redact",
			lastName: "redact",
			screenshot: url,
			screenshot2: url2,
			iv: "redact",
		})

		if (!response.ok) {
			console.error("Project creation failed:", {
				status: response.status,
				timestamp: new Date().toISOString(),
			})
			return fail(500, { message: "Project creation failed. Please notify TheUtkarsh8939 on Slack" })
		}
		return { success: true }
	},
	update: async event => {
		const data = requireUserApi(event.locals)
		const email = data.email
		const formData = await event.request.formData()
		const projectName = formData.get("name") as string
		const projectDescription = formData.get("description") as string
		const projectType = formData.get("type") as string
		const projectUrl = formData.get("demo") as string
		const projectCode = formData.get("github") as string
		const oldProject = formData.get("projectUpdate") as string
		const hackatimeProject = formData.get("hackatime") as string
		const theme = formData.get("theme") as string
		const recordId = formData.get("recordId") as string
		const screenshot = formData.get("screenshot") as File
		const screenshot2 = formData.get("screenshot-2") as File

		const linkError = validateProjectLinks(projectUrl, projectCode)
		if (linkError) {
			return fail(400, { message: linkError })
		}
		// All checks run before uploading, so a refused edit never uploads screenshots
		const current = await getProjectForEdit(recordId, email)
		if (!current) {
			return fail(404, { message: "Project not found" })
		}
		if (isInReview(current.status)) {
			return fail(409, { message: "This project is being reviewed, so it can't be edited right now. You can edit it again once the review is done." })
		}
		if (hackatimeProject && hackatimeProject !== current.hackatime) {
			if (current.log !== "") {
				return fail(400, { message: "The Hackatime project can't be changed after the project has been shipped." })
			}
			const conflicts = await findHackatimeConflicts(email, hackatimeProject, current.id)
			if (conflicts.length > 0) {
				return fail(400, { message: hackatimeConflictMessage(conflicts) })
			}
		}

		const [url, url2] = await Promise.all([
			uploadScreenshot(screenshot),
			uploadScreenshot(screenshot2),
		])
		const response = await updateProject(
			recordId,
			{
				Name: projectName,
				description: projectDescription,
				type: projectType,
				demo: projectUrl,
				code: projectCode,
				hackatime: hackatimeProject,
				update: oldProject,
				Theme: theme,
				screenshot: url,
				screenshot2: url2,
			},
			email
		)

		if (!response.ok) {
			// 409: the project entered review (or was shipped) between the checks above and the write
			const message = response.status === 409
				? "This project changed while you were editing it (it may have been shipped). Please refresh and try again."
				: "Project update failed. Please notify TheUtkarsh8939 on Slack"
			console.error("Project update failed:", { status: response.status, timestamp: new Date().toISOString() })
			return fail(response.status === 409 ? 409 : 500, { message })
		}
		return { success: true }
	},
} satisfies Actions
export const load: PageServerLoad = async ({ locals }) => {
	const email = requireUserPage(locals).email
	const hackatimeAccessToken = await getHackatimeTokenByEmail(email)
	if (!hackatimeAccessToken) {
		throw redirect(303, hackatimeAuthUrl)
	}
	let hacks: any
	if (hackatimeAccessToken) {
		let [hackatimes, projectsResponse] = await Promise.all([
			fetch(
				`https://hackatime.hackclub.com/api/v1/authenticated/projects?include_archived=false&start=${env.START_DATE}`,
				{
					headers: {
						Authorization: `Bearer ${hackatimeAccessToken}`,
						"Content-Type": "application/json",
					},
				}
			),
			getProjectsByOwner(email),
		])
		hacks = await hackatimes.json()

		const projectsData = await projectsResponse.json()
		let projectsRecords: AirtableProjectWithPII[] = projectsData.records || []
		let noPii: AirtableProject[] = []
		for (let record of projectsRecords) {
			noPii.push({
				id: record.id,
				fields: {
					Name: record.fields.Name,
					description: record.fields.description,
					type: record.fields.type,
					demo: record.fields.demo,
					code: record.fields.code,
					update: record.fields.update,
					hackatime: record.fields.hackatime,
					languages: record.fields.languages,
					log: filterLogs(record.fields.log),
					owner: record.fields.owner,
					status: record.fields.status,
					slackId: record.fields.slackId,
					Theme: record.fields.Theme,
					screenshot: record.fields.screenshot,
					screenshot2: record.fields.screenshot2,
					journals: record.fields.journals,
				},
			})
		}
		let filteredHacks: any[] = []
		hacks.projects.forEach((project: any) => {
			filteredHacks.push({
				name: project.name,
				total_seconds: project.total_seconds,
			})
		})
		let filteredHacksS = {
			projects: filteredHacks,
		}
		return {
			projects: noPii,
			hacks: filteredHacksS || [],
		}
	}

	return {
		projects: [],
	}
}
