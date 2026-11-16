export interface HackatimeProject {
	name: string
	total_seconds: number
}

export type HackatimeProjectsResult =
	| { ok: true; projects: HackatimeProject[] }
	// unauthorized: the stored OAuth token was revoked or expired, so the user has to connect Hackatime again
	| { ok: false; reason: "unauthorized" | "unavailable" }

// The user's Hackatime projects since startDate. Never throws: callers decide how to recover.
export const fetchHackatimeProjects = async (
	accessToken: string,
	startDate: string
): Promise<HackatimeProjectsResult> => {
	try {
		const response = await fetch(
			`https://hackatime.hackclub.com/api/v1/authenticated/projects?include_archived=false&start=${encodeURIComponent(startDate)}`,
			{
				headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
				signal: AbortSignal.timeout(15_000),
			}
		)
		if (response.status === 401 || response.status === 403) {
			return { ok: false, reason: "unauthorized" }
		}
		if (!response.ok) {
			console.error("Hackatime projects request failed:", response.status)
			return { ok: false, reason: "unavailable" }
		}
		const body = await response.json()
		if (!Array.isArray(body?.projects)) {
			return { ok: false, reason: "unavailable" }
		}
		return {
			ok: true,
			projects: body.projects.map((project: { name?: unknown; total_seconds?: unknown }) => ({
				name: String(project.name ?? ""),
				total_seconds: Number(project.total_seconds ?? 0),
			})),
		}
	} catch (error) {
		console.error("Hackatime projects request failed:", error)
		return { ok: false, reason: "unavailable" }
	}
}
