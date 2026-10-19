// HTTP client for Telescreen's Robert API (https://telescreen.hackclub.com/robert/docs), the submission payload
// and the webhook signature check. Pure: no $env/$lib imports and no database, so script/telescreen.ts and
// testing/manualTests/test-telescreen.ts can use it directly.
import { createHmac, timingSafeEqual } from "node:crypto"
import { isHttpUrl } from "../urls"
import { hackatimeProjectNames } from "./projectLog"

export interface TelescreenConfig {
	baseUrl: string
	apiKey: string
	webhookSecret: string
	eventSlug: string
}

const DEFAULT_BASE_URL = "https://telescreen.hackclub.com"

// Read at call time from process.env (like DATABASE_URL in $lib/db) so the same code runs in the app and in scripts.
// null when the API key is missing: Telescreen is then treated as unavailable, never skipped.
export const telescreenConfigFromEnv = (env: Record<string, string | undefined> = process.env): TelescreenConfig | null => {
	const apiKey = env.ROBERT_API_KEY?.trim() ?? ""
	if (!apiKey.startsWith("ysws_")) return null
	return {
		baseUrl: env.ROBERT_BASE_URL?.trim() || DEFAULT_BASE_URL,
		apiKey,
		webhookSecret: env.ROBERT_WEBHOOK_SECRET?.trim() ?? "",
		eventSlug: env.ROBERT_EVENT_SLUG?.trim() ?? "",
	}
}

export type RobertState = "awaiting_review" | "awaiting_outcome" | "rejected_fraud" | "decided"
export const ROBERT_STATES: readonly RobertState[] = ["awaiting_review", "awaiting_outcome", "rejected_fraud", "decided"]

export interface RobertProject {
	id: string
	externalId: string | null
	state: RobertState
	trustScore: number | null
	review: { trustScore: number, note: string | null, at: string } | null
	outcome: { status: "approved" | "rejected", reason: string | null, at: string } | null
	submittedAt: string | null
	creditedSeconds: number | null
}

export type RobertResult<T> =
	| { ok: true, status: number, data: T }
	// status 0 = no answer (timeout or network error)
	| { ok: false, status: number, message: string }

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isUuid = (value: unknown): value is string => typeof value === "string" && UUID_PATTERN.test(value)

const REQUEST_TIMEOUT_MS = 10_000

const call = async <T>(config: TelescreenConfig, method: string, path: string, body?: unknown): Promise<RobertResult<T>> => {
	try {
		const response = await fetch(new URL(path, config.baseUrl), {
			method,
			headers: {
				Authorization: `Bearer ${config.apiKey}`,
				Accept: "application/json",
				...(body === undefined ? {} : { "Content-Type": "application/json" }),
			},
			body: body === undefined ? undefined : JSON.stringify(body),
			// Never follow a redirect with the API key attached
			redirect: "error",
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
		})
		const data = await response.json().catch(() => null)
		if (!response.ok) {
			const message = typeof data?.message === "string" && data.message !== "" ? data.message : `Telescreen answered ${response.status}`
			return { ok: false, status: response.status, message }
		}
		return { ok: true, status: response.status, data: data as T }
	} catch (error) {
		const timedOut = (error as Error)?.name === "TimeoutError"
		return { ok: false, status: 0, message: timedOut ? "Telescreen did not answer in time" : "Could not reach Telescreen" }
	}
}

// Ids end up in URL paths; anything that is not a UUID is refused before a request is made
const projectPath = (robertProjectId: string, suffix = ""): string | null =>
	isUuid(robertProjectId) ? `/api/v1/ysws/projects/${robertProjectId}${suffix}` : null

const invalidId = <T>(): RobertResult<T> => ({ ok: false, status: 400, message: "Invalid Telescreen project id" })

export interface RobertSubmission {
	name: string
	kind: "hackatime"
	codeUrl: string
	demoUrl?: string
	submitter: { slackId: string, hackatimeId?: number }
	hackatimeProjects: string[]
	externalId: string
}

export const submitProject = (config: TelescreenConfig, submission: RobertSubmission) =>
	call<{ id: string, state: RobertState, created: boolean }>(config, "POST", "/api/v1/ysws/projects", submission)

export const getProject = (config: TelescreenConfig, robertProjectId: string) => {
	const path = projectPath(robertProjectId)
	return path ? call<RobertProject>(config, "GET", path) : Promise.resolve(invalidId<RobertProject>())
}

export const listProjects = (config: TelescreenConfig, query: { state: RobertState, limit: number, offset: number }) =>
	call<{ total: number, projects: RobertProject[] }>(config, "GET", `/api/v1/ysws/projects?${new URLSearchParams({
		state: query.state,
		limit: String(query.limit),
		offset: String(query.offset),
	})}`)

export const recordOutcome = (config: TelescreenConfig, robertProjectId: string, outcome: { status: "approved" | "rejected", reason?: string }) => {
	const path = projectPath(robertProjectId, "/outcome")
	return path
		? call<{ id: string, state: RobertState, outcome: RobertProject["outcome"] }>(config, "POST", path, outcome)
		: Promise.resolve(invalidId<{ id: string, state: RobertState, outcome: RobertProject["outcome"] }>())
}

// Only allowed before a fraud reviewer has scored the project (409 afterwards)
export const deleteProject = (config: TelescreenConfig, robertProjectId: string, signedOffBy: string) => {
	const path = projectPath(robertProjectId)
	return path
		? call<{ id: string, deleted: boolean }>(config, "DELETE", path, { signedOffBy })
		: Promise.resolve(invalidId<{ id: string, deleted: boolean }>())
}

export const setWebhookUrl = (config: TelescreenConfig, webhookUrl: string | null) =>
	call<{ webhookUrl: string | null, secret: string | null }>(config, "PATCH", "/api/v1/ysws/event", { webhookUrl })

// Robert caps hackatimeProjects at 50 distinct names
const MAX_HACKATIME_PROJECTS = 50

// The submission sent to Telescreen. Data minimisation: the project's name and links, the owner's Slack ID (and
// Hackatime user id when known) and the Hackatime project names Robert needs to credit time. Never the owner's
// email, name, address, birthdate or Unified ID. Every Alchemize project type is software, so kind is hackatime.
export const buildSubmission = (
	project: { Name: string, code: string | null, demo: string | null, slackId: string, hackatime: string },
	externalId: string,
	hackatimeId?: number | null
): RobertSubmission | string => {
	const name = project.Name.trim()
	if (name === "") return "The project has no name"
	if (!isHttpUrl(project.code)) return "The project has no valid repository link"
	if (!/^[UW][A-Z0-9]+$/.test(project.slackId ?? "")) return "The project owner has no Slack ID"
	const hackatimeProjects = [...new Set(hackatimeProjectNames(project.hackatime))]
	if (hackatimeProjects.length === 0) return "The project has no Hackatime project"
	if (hackatimeProjects.length > MAX_HACKATIME_PROJECTS) return `The project names more than ${MAX_HACKATIME_PROJECTS} Hackatime projects`
	return {
		name,
		kind: "hackatime",
		codeUrl: project.code!.trim(),
		...(isHttpUrl(project.demo) ? { demoUrl: project.demo.trim() } : {}),
		submitter: {
			slackId: project.slackId,
			...(Number.isSafeInteger(hackatimeId) && hackatimeId! > 0 ? { hackatimeId: hackatimeId! } : {}),
		},
		hackatimeProjects,
		externalId,
	}
}

const SIGNATURE_TOLERANCE_SECONDS = 300

// X-Robert-Signature is "sha256=" + hex HMAC-SHA256 of "<X-Robert-Timestamp>.<raw body>" keyed by the webhook
// secret. Checked on the raw bytes before any parsing, in constant time, and refused when the timestamp is more
// than five minutes off so a captured delivery can't be replayed later.
export const verifyWebhookSignature = (
	secret: string,
	timestamp: string | null,
	signature: string | null,
	rawBody: string,
	nowSeconds = Date.now() / 1000
): boolean => {
	if (secret === "" || typeof timestamp !== "string" || typeof signature !== "string") return false
	if (!/^\d+$/.test(timestamp)) return false
	if (Math.abs(nowSeconds - Number(timestamp)) > SIGNATURE_TOLERANCE_SECONDS) return false
	const expected = Buffer.from("sha256=" + createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex"))
	const received = Buffer.from(signature)
	return expected.length === received.length && timingSafeEqual(expected, received)
}
