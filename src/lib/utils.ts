import {
	PUBLIC_HACKATIME_AUTH,
	PUBLIC_HACKATIME_REDIRECT,
	PUBLIC_HACKCLUB_AUTH,
	PUBLIC_HACKCLUB_REDIRECT,
} from "$env/static/public"
import type {Address} from "./types"
interface Data {
	id: string
	email: string
	slack_id: string
	first_name: string
	last_name: string
	verification_status: string
	address: Address[]
	birthday: string
}
export const scopes =
	"openid+profile+email+name+verification_status+slack_id+address+basic_info"
export const authUrl = `/auth`

type HackatimeProject = {
	name?: string
	project_name?: string
	project?: string
	total_seconds?: number
}
export const hackatimeAuthUrl = `https://hackatime.hackclub.com/oauth/authorize?client_id=${PUBLIC_HACKATIME_AUTH}&redirect_uri=${encodeURIComponent(PUBLIC_HACKATIME_REDIRECT)}&response_type=code&scope=profile+read`
export const getDataFromAccessToken = async (
	accessToken: string
): Promise<Data> => {
	if (accessToken === undefined || accessToken === "") {
		throw new Error("Access token is undefined or empty")
	}
	const response = await fetch("https://auth.hackclub.com/api/v1/me", {
		method: "GET",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
	})
	const data = await response.json()
	if (!response.ok) {
		throw new Error(
			data?.message ?? "Failed to fetch user data from access token"
		)
	}
	return {
		id: data.identity.id,
		email: data.identity.primary_email,
		verification_status: data.identity.verification_status,
		first_name: data.identity.first_name,
		last_name: data.identity.last_name,
		slack_id: data.identity.slack_id,
        address: data.identity.addresses,
        birthday: data.identity.birthday,
	}
}
export const getSlackProfile = async (slackId: string): Promise<string> => {
	const response = await fetch("https://cachet.hackclub.com/users/" + slackId)
	const data = await response.json()
	if (!response.ok) {
		throw new Error(data?.message ?? "Failed to fetch Slack profile")
	}
	return data
}
export function formatHours(totalSeconds: number | undefined): string {
	const hours = (totalSeconds ?? 0) / 3600
	const mins = (totalSeconds ?? 0) % 3600
	return `${Math.floor(hours)}hr ${Math.floor(mins / 60)}min`
}
export function getHackatimeProjects(payload: unknown): HackatimeProject[] {
	if (!payload || typeof payload !== "object") return []
	const maybeProjects = (payload as { projects?: unknown }).projects
	return Array.isArray(maybeProjects)
		? (maybeProjects as HackatimeProject[])
		: []
}
export const countCharacters = (str: string) => {
	return str.trim().length
}
