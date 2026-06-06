import type { RequestHandler } from "@sveltejs/kit"
import {  BOT_AUTH, USER_JWT_SECRET } from "$env/static/private"
import {START_DATE} from "$env/static/private"
import { getDataFromAccessToken } from "$lib/utils"
import type { Log } from "$lib/types"
import { getProjectById, patchProjectForShip } from "$lib/db"
import jwt from "jsonwebtoken"
/* REQUEST BODY
	-Hackatime Access token(Now derived from Cookies)
	-Record ID
	-Hackclub Access Token (for fetching slackID and verifying ownership, Now derived from Cookies)
*/

function parseLog(logJson: string): Log[] {
	try {
		return JSON.parse(logJson) as Log[]
	} catch (error) {
		console.error("Invalid log JSON:", error)
		// throw new Error("Failed to parse log data")
		return [] as Log[]
	}
}
async function getProject(recordId: string) {
	const response = await getProjectById(recordId)
	if (!response.ok) {
		console.error(`Failed to fetch project ${recordId}:`, response.status)
		throw new Error(`Airtable error: ${response.status}`)
	}
	const data = await response.json()
	if (!data.fields) {
		throw new Error("Invalid project structure")
	}
	return data
}
async function getHackatimeProject(accessToken: string, hackatimeProjectName: string) {
	const hackatimes = await fetch(`https://hackatime.hackclub.com/api/v1/authenticated/projects?include_archived=false&start=${START_DATE}`,{
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": 'application/json'
		}
	})
	if (!hackatimes.ok) {
		console.error("Failed to fetch Hackatime projects:", hackatimes.status)
		throw new Error(`Hackatime API error: ${hackatimes.status}`)
	}
	const hackatimeData = await hackatimes.json()
	if (!Array.isArray(hackatimeData.projects)) {
		throw new Error("Invalid Hackatime response structure")
	}
	const project = hackatimeData.projects.find((hack: any) => hack.name === hackatimeProjectName)
	if (!project) {
		console.warn(`Project "${hackatimeProjectName}" not found in Hackatime`)
		throw new Error(`Project not found: ${hackatimeProjectName}`)
	}
	return project
}
function updateLog(log: Log[], deltaTime: number, changelog: string): Log[] {
	//4 cases:
	//1. If the log is empty, create a new log with status pending
	//2. If the last log is approved, create a new log with status pending
	//3. If the last log is rejected, convert that log to pending with the new timestamp and message and add delta time to the exisiting delta time
	//4. If the last log is pending, update the timestamp, message and add delta time to the existing delta time
	if (log.length === 0) {
		return [{
			status: 0,
			timestamp: new Date().toISOString(),
			deltaTime,
			message: [{ userExternal: changelog, internalNote: "", justification: "", timestamp: new Date().toISOString(), reviewerName: "user" }],
			submmitedToHQ: false
		}]
	}
	const lastLog = log[log.length - 1]
	if (lastLog.status === 1) {
		return [...log, {
			status: 0,
			timestamp: new Date().toISOString(),
			deltaTime,
			message: [{ userExternal: changelog, internalNote: "", justification: "", timestamp: new Date().toISOString(), reviewerName: "user" }],
			submmitedToHQ: false
		}]
	}
	else if (lastLog.status === 0 || lastLog.status === 2) {
		const newDeltaTime = lastLog.deltaTime + deltaTime
		return [...log.slice(0, -1), {
			...lastLog,
			status: 0,
			timestamp: new Date().toISOString(),
			deltaTime: newDeltaTime,
			message: [...lastLog.message, { userExternal: changelog, internalNote: "", justification: "", timestamp: new Date().toISOString(), reviewerName: "user" }],
			submmitedToHQ: false
		}]
	}else{
		return log
	}

}
function calculateRecordedTime(log: Log[]): number {
	let totalTime = 0
	for (const entry of log) {
		totalTime += entry.deltaTime
	}
	return totalTime
}
export const POST: RequestHandler = async ({ request,cookies }) => {
	const { recordId, changelog } = await request.json()
	const accessToken = cookies.get('access_token_new')
	const hackatimeToken = cookies.get('hackatime_token')
	if (!hackatimeToken || !recordId || !accessToken) {
		return new Response("Missing required fields", { status: 400 })
	}
	const projectData = await getProject(recordId)
	const hackatimeProject = await getHackatimeProject(hackatimeToken, projectData.fields.hackatime)
	const previousLogs= parseLog(projectData.fields.log || "[]")
	const recordedTime = calculateRecordedTime(previousLogs)
	const hackatimeTime = Math.floor(hackatimeProject.total_seconds / 60)
	const deltaTime = hackatimeTime - recordedTime
	if (deltaTime <= 0) {
		return new Response("No new time recorded since last ship", { status: 400 })
	}
	//Confirm ownership by comparing email from access token with project owner email
	const authToken = cookies.get('user_token');
	let decoded = null;
try {
	if(authToken){
		decoded = jwt.verify(authToken, USER_JWT_SECRET);
	}
} catch (error) {
	console.error('Invalid user token:', error);
}
const userData = decoded ? (decoded as any) : null;
	if(projectData.fields.owner){
		if (userData.email !== projectData.fields.owner) {
		return new Response("Unauthorized: You do not own this project", { status: 403 })
	}
	}else{
		console.warn(`Missing/Malformed owner email for project ${recordId}. Proceeding without ownership verification.`)
	}
	const currentTime = Date.now()
	const updatedLog = updateLog(previousLogs, deltaTime, changelog)
	const response = await patchProjectForShip(recordId, updatedLog, `pending_${currentTime}`)
	if (!response.ok) {
		console.error(`Failed to update project ${recordId}:`, response.status, await response.json())
		return new Response("Failed to update project log", { status: 500 })
	}
	const botResponse = await fetch("https://aoishik.qzz.io/ship", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${BOT_AUTH}`
		},
		body: JSON.stringify(
			{ "user_id": userData.slack_id, "project_name": projectData.fields.Name, "project_link": projectData.fields.code }
		)
	})
	if (!botResponse.ok) {
		console.warn(`Failed to send notification to bot for record ${recordId}:`, {
			status: botResponse.status,
			statusText: botResponse.statusText,
			timestamp: new Date().toISOString(),
			slackId: userData.slack_id,
			projectName: projectData.fields.Name,
			projectLink: projectData.fields.code
		})
		return new Response("Project shipped but failed to send notification", { status: 207 })
	}
	return new Response(JSON.stringify({ message: "Project shipped successfully!", newLog: updatedLog, newStatus: `pending_${currentTime}` }), { status: 201 })
}
export const GET: RequestHandler = async () => {
	return new Response("You should not be here! go away", { status: 401 })
}
