import type { Actions, PageServerLoad } from "./$types"
import crypto from "crypto"
import { env } from "$env/dynamic/private"
import { getDataFromAccessToken, hackatimeAuthUrl} from "$lib/utils"
import {encryptAES} from "$lib/utils.server"
import {
	getProjectsByOwner,
	createProject,
	updateProject,
	getUserByEmail,
	
} from "$lib/db"
import { USER_JWT_SECRET } from "$env/static/private"
import type {
	AirtableProject,
	AirtableProjectWithPII,
	UserAuthToken,
	Log
} from "$lib/types"
import { redirect } from "@sveltejs/kit"
import jwt from "jsonwebtoken"
export const actions = {
	create: async event => {
		const accessToken = event.cookies.get("access_token_new")
		const user_token = event.cookies.get("user_token")
		let data = {} as UserAuthToken
		if (!accessToken || !user_token) {
			throw new Error(
				"No user token found. Please login again and try submitting the project."
			)
		}
		try {
			if (user_token) {
				data = jwt.verify(user_token, USER_JWT_SECRET) as UserAuthToken
			} else {
				throw new Error(
					"No user token found. Please login again and try submitting the project."
				)
			}
		} catch (error) {
			console.error("Invalid user token:", error)
			throw new Error(
				"Invalid user token. Please login again and try submitting the project."
			)
		}

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
		const tempFormData = new FormData()
		const screenshot = formData.get("screenshot") as File
		let url = ""
		let iv = crypto.randomBytes(16).toString("hex")
				if((projectUrl && !URL.canParse(projectUrl)) || (projectCode && !URL.canParse(projectCode))) {
			throw new Error("Invalid project URL or code repository URL")
		}
		if (screenshot && screenshot.size > 0) {
			tempFormData.append("file", screenshot)
			var [cdnResponse, userData] = await Promise.all([
				fetch("https://cdn.hackclub.com/api/v4/upload", {
					method: "POST",
					headers: { Authorization: "Bearer " + env.CDN_UPLOAD_SECRET },
					body: tempFormData,
				}),
				getDataFromAccessToken(accessToken),
			])
			if (!cdnResponse.ok) {
				const errorData = await cdnResponse.json()
				const errorCode = errorData.error?.type || "UNKNOWN_ERROR"
				const errorText =
					errorData.error?.message ||
					"An error occurred while uploading the screenshot"
				console.error("CDN upload failed:", {
					status: cdnResponse.status,
					errorCode,
					errorText,
					timestamp: new Date().toISOString(),
				})
				throw new Error(
					`Screenshot upload failed: ${errorText}. Please notify TheUtkarsh8939 on slack with the error code: ${errorCode}`
				)
			}
			url = (await cdnResponse.json()).url
		} else {
			var userData = await getDataFromAccessToken(accessToken)
		}
		const addressEncrypted = encryptAES(JSON.stringify(userData.address || []), Buffer.from(iv, "hex"))
		const bdayEncrypted = encryptAES(userData.birthday || "", Buffer.from(iv, "hex"))
		const firstNameEncrypted = encryptAES(userData.first_name || "", Buffer.from(iv, "hex"))
		const lastNameEncrypted = encryptAES(userData.last_name || "", Buffer.from(iv, "hex"))
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
			address: addressEncrypted.finalString,
			birthdate: bdayEncrypted.finalString,
			slackId: slackId,
			firstName: firstNameEncrypted.finalString,
			lastName: lastNameEncrypted.finalString,
			screenshot: url,
			iv: iv,
		})

		// Error handling
		if (!response.ok) {
			const errorData = await response.json()
			const errorCode = errorData.error?.type || "UNKNOWN_ERROR"
			const errorText =
				errorData.error?.message ||
				"An error occurred while creating the project"

			console.error("Project creation failed:", {
				status: response.status,
				errorCode,
				errorText,
				timestamp: new Date().toISOString(),
			})

			return {
				success: false,
				error: {
					title: "Project creation failed",
					code: errorCode,
					message: `${errorText}. Please notify TheUtkarsh8939 on slack`,
				},
			}
		} else {
			return {
				success: true,
			}
		}
	},
	update: async event => {
		const accessToken = event.cookies.get("access_token_new")
		const user_token = event.cookies.get("user_token")
		let data = {} as UserAuthToken
		try {
			if (user_token) {
				data = jwt.verify(user_token, USER_JWT_SECRET) as UserAuthToken
			} else {
				return {
					success: false,
					error: {
						title: "Unauthorized",
						code: "NO_USER_TOKEN",
						message:
							"No user token found. Please login again and try submitting the project.",
					},
				}
			}
		} catch (error) {
			console.error("Invalid user token:", error)
			return {
				success: false,
				error: {
					title: "Unauthorized",
					code: "INVALID_USER_TOKEN",
					message:
						"Invalid user token. Please login again and try submitting the project.",
				},
			}
		}
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
		const tempFormData = new FormData()
		const screenshot = formData.get("screenshot") as File
		let url = ""
if((projectUrl && !URL.canParse(projectUrl)) || (projectCode && !URL.canParse(projectCode))) { 
			throw new Error("Invalid project URL or code repository URL")
		}
		if (screenshot && screenshot.size > 0) {
			tempFormData.append("file", screenshot)
			var [cdnResponse] = await Promise.all([
				fetch("https://cdn.hackclub.com/api/v4/upload", {
					method: "POST",
					headers: { Authorization: "Bearer " + env.CDN_UPLOAD_SECRET },
					body: tempFormData,
				}),
			])
			if (!cdnResponse.ok) {
				const errorData = await cdnResponse.json()
				const errorCode = errorData.error?.type || "UNKNOWN_ERROR"
				const errorText =
					errorData.error?.message ||
					"An error occurred while uploading the screenshot"
				console.error("CDN upload failed:", {
					status: cdnResponse.status,
					errorCode,
					errorText,
					timestamp: new Date().toISOString(),
				})
				throw new Error(
					`Screenshot upload failed: ${errorText}. Please notify TheUtkarsh8939 on slack with the error code: ${errorCode}`
				)
			}
			url = (await cdnResponse.json()).url
		}
		if (url !== "") {
			console.log("Theme:", theme)
			var response = await updateProject(
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
				},
				email
			)
		} else {
			console.log("Theme:", theme)

			var response = await updateProject(
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
				},
				email
			)
		}

		// Error handling
		if (!response.ok) {
			const errorData = await response.json()
			const errorCode = errorData.error?.type || "UNKNOWN_ERROR"
			const errorText =
				errorData.error?.message ||
				"An error occurred while updating the project"

			console.error("Project update failed:", {
				status: response.status,
				errorCode,
				errorText,
				timestamp: new Date().toISOString(),
			})

			return {
				success: false,
				error: {
					title: "Project update failed",
					code: errorCode,
					message: `${errorText}. Please notify TheUtkarsh8939 on slack`,
				},
			}
		} else {
			return {
				success: true,
			}
		}
	},
} satisfies Actions
const filterLogs = (logsJson: string) => {
	
	
	const logs = JSON.parse(logsJson || "[]") as Log[]
	
	let filteredLogs: Log[] = []
	logs.forEach(log => {
		let message = log.message
		message.forEach(msg => {
			msg.internalNote = ""
			msg.justification = ""
			if (msg.reviewerName?.startsWith("APPROVED")) {
				msg.reviewerName = "APPROVED"
			}else if(msg.reviewerName === "user"){
				msg.reviewerName = "user"
			}else{
				msg.reviewerName = "REVIEWER"
			}
		})
		log.message = message
		filteredLogs.push(log)
	})
	return JSON.stringify(filteredLogs)
}
export const load: PageServerLoad = async ({ cookies }) => {
	const accessToken =
		cookies.get("access_token_new") ?? cookies.get("access_token")
	const user_token = cookies.get("user_token")
	let decoded = null
	try {
		if (user_token) {
			decoded = jwt.verify(user_token, USER_JWT_SECRET)
		}
	} catch (error) {
		console.error("Invalid user token:", error)
	}
	if (!accessToken) {
		return { error: "No access token found" }
	}
	const email = decoded ? (decoded as any).email : null
	if (!accessToken) {
		return {
			projects: [],
		}
	}
	const userResponse = await getUserByEmail(email)
	if (!userResponse.ok) {
		console.error("Database error:", await userResponse.text())
		return {
			error: "Database error",
			projects: [],
		}
	}
	const hackatimeAccessToken = (await userResponse.json())?.records?.[0]?.fields
		?.hackatime
	if (!hackatimeAccessToken || hackatimeAccessToken === "") {
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
