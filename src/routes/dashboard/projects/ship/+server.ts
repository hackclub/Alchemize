import type { RequestHandler } from "@sveltejs/kit"
import { AIRTABLE, AIRTABLE_CLIENT, BOT_AUTH } from "$env/static/private"
type Log = {
	status: "ap" | "re" | "pe" //approved, rejected, pending
	time: number //time in minutes
}
function parseLogSyntax(log: string): Log[] {
	//LOG SYNTAX: The logs are the data showing past approvals and current state
	//Each new log entry is seperated by a comma(,)
	//Each log entry has 8 charecters, first two reperesent its status(it can be "ap" for approved, "re" for rejected, "pe" for pending)
	//Rest of charectors reperesent time that the status represent, they are total number of minutes
	//Example Log: "ap000010,pe003223"
	//A log can only have one pending entry, and it has to be the last entry, and only one number of re entries can be there which must be the last entry
	//Whenever log is appended lets say the log "ap000010,pe003223" is there and the project gets approved, then log will be updated to "ap000010,ap003223"
	//If log is "ap000010,pe003223" and project gets rejected, then log will be updated to "ap000010,re003223"
	//If log is "ap000010,re003223" and project gets updated again with 20 minutes, then log will be updated to "ap000010,pe003243"
	const logEntries = log.split(",")
	return logEntries.map(entry => {
		const status = entry.substring(0, 2) as "ap" | "re" | "pe"
		const time = parseInt(entry.substring(2), 10)
		return { status, time }
	})
}
function convertLogToString(log: Log): string {
	//Takes a single log object and converts it to string in the format used in the database
	//Example: {status: "ap", time: 10} will be converted to "ap000010"
	const timeString = log.time.toString().padStart(6, "0")
	return `${log.status}${timeString}`
}
function convertLogArrayToString(logArray: Log[]): string {
	//Takes an array of log objects and converts it to a string in the format used in the database
	//Example: [{status: "ap", time: 10}, {status: "pe", time: 3223}] will be converted to "ap000010,pe003223"
	return logArray.map(convertLogToString).join(",")
}
function calculateLoggedTime(log: Log[]): number {
	//Calculates the total logged time in minutes from the log array(all logs are counted)
	//IF last log has status "re" then we will not count the time of that log because it represents the time when the project got rejected and after that no more time can be logged until the project gets updated again
	if (log.length === 0) {
		return 0
	}
	if (log[log.length - 1].status === "re") {
		// Exclude the time of the last log if it's rejected
		return log.slice(0, -1).reduce((total, entry) => total + entry.time, 0)
	}
	return log.reduce((total, entry) => total + entry.time, 0)
}
function updateLog(log: Log[], timeToAdd: number): Log[] {
	const newStatus = "pe"
	//Three cases:
	//Case 1: if the last log in the log array has status "pe", then we will update its time by adding timeToAdd to it(newTime = oldTime + timeToAdd)
	//Case 2: if the last log in the log array has status "ap" and timeToAdd is greater than 0, then we will add a new log with status "pe" and time timeToAdd to the log array
	//Case 3: If the last log in the log array has status "re" and timeToAdd is greater than 0 then we will pop the last log
	//And then we will add a new log with status "pe" and time timeToAdd+oldTime to the log array(where oldTime is the time of the log that we just popped)
	let lastLog = { status: "pe", time: 0 }
	if (log.length != 0) {

		lastLog = log[log.length - 1]
	}
	if (lastLog.status === "pe") {
		lastLog.time += timeToAdd
		return log
	} else if (lastLog.status === "ap" && timeToAdd > 0) {
		log.push({ status: newStatus, time: timeToAdd })
		return log
	} else if (lastLog.status === "re" && timeToAdd > 0) {
		const oldTime = lastLog.time
		log.pop()
		log.push({ status: newStatus, time: timeToAdd + oldTime })
		return log
	} else {
		return log
	}
}
export const POST: RequestHandler = async ({ request, cookies }) => {
	const json = await request.json()
	const recordId = json.recordId
	let unParsedLog = json.log
	if (unParsedLog === "") {
		unParsedLog = "pe000000"
	}
	const parsedLog = parseLogSyntax(unParsedLog)
	const loggedTime = calculateLoggedTime(parsedLog)
	const timeToAdd = json.hackatime - loggedTime
	if (timeToAdd < 0) {
		return new Response("Logged time cannot be more than hackatime", {
			status: 400,
		})
	}
	const currentTime = Date.now()
	const updatedLog = updateLog(parsedLog, timeToAdd)
	const logString = convertLogArrayToString(updatedLog)
	const response = await fetch(
		`https://api.airtable.com/v0/${AIRTABLE_CLIENT}/Projects/${recordId}`,
		{
			method: "PATCH",
			headers: {
				Authorization: `Bearer ${AIRTABLE}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				fields: {
					log: logString,
					status: `pending_${currentTime}`,
				},
			}),
		}
	)
	//Error handling
	if (!response.ok) {
		const errorData = await response.json()
		const errorCode = errorData.error?.type || "UNKNOWN_ERROR"
		const errorText =
			errorData.error?.message || "An error occurred while updating the log"
		console.error("Log update failed:", {
			status: response.status,
			errorCode,
			errorText,
			timestamp: new Date().toISOString(),
		})
		return new Response("Failed to update log", { status: 500 })
	}
	const accessToken = cookies.get("access_token")
	let slackId = cookies.get("slack_id")
	if (!slackId || slackId === "") {
		const extraInfoData = await fetch("https://auth.hackclub.com/api/v1/me", {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		})
		const extraInfo = await extraInfoData.json()
		if (!extraInfoData.ok) {
			console.error(
				extraInfoData.status,
				extraInfo?.message ?? "Failed to fetch extra user info"
			)
		}
		console.log(extraInfo)
		if (extraInfo?.identity.slack_id) {
			slackId = extraInfo.identity.slack_id
		}
	}
	const botResponse = await fetch("https://aoishik.qzz.io/ship", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${BOT_AUTH}`
		},
		body: JSON.stringify(
			{ "user_id": slackId, "project_name": json.name, "project_link": json.code }
		)
	})
	if (!botResponse.ok) {
		console.warn(`Failed to send notification to bot for record ${recordId}:`, {
			status: botResponse.status,
			statusText: botResponse.statusText,
			timestamp: new Date().toISOString(),
			slackId,
			projectName: json.name,
			projectLink: json.code
		})
	}

	return new Response("Log updated successfully", { status: 200 })
}
export const GET: RequestHandler = async () => {
	return new Response("You should not be here! go away", { status: 403 })
}
