// Telescreen (Robert) fraud review, see https://telescreen.hackclub.com/robert/docs
//
// A project is sent to Telescreen when a T1 reviewer accepts it. A fraud reviewer scores it there: 4 or below is a
// final fraud rejection (webhook), anything higher waits on our decision (no webhook, so its state is read back).
// The T2 reviewer's approve/return is recorded in Telescreen as the outcome.
//
// Invariants:
// - Telescreen can only ever reject or record here. Nothing it sends (webhook or API answer) awards currency or
//   pushes to Unified; a T2 reviewer always does that, through the approval gate below.
// - A review only counts for the time it saw: if the participant ships again after it was submitted, it is
//   superseded and the project is submitted afresh (see isUpToDate).
// - Only reviewer-facing code reads these rows. The fraud reviewer's note and score never reach participants.
//
// Relative imports (not $lib) so script/telescreen.ts can run this with tsx.
import {
	findTelescreenSubmissionByRobertId,
	getLatestTelescreenSubmission,
	getOpenTelescreenSubmission,
	getProjectForTelescreen,
	getTelescreenSubmissionsInStates,
	openTelescreenSubmission,
	patchProjectForShip,
	updateTelescreenSubmission,
	type TelescreenSubmission,
} from "../db"
import type { Log, TelescreenView } from "../types"
import * as robert from "./telescreenClient"
import { applyT2Reject, latestUnpaidShipTime } from "./projectLog"

export const telescreenConfig = () => robert.telescreenConfigFromEnv()

const NOT_CONFIGURED = "Telescreen isn't configured on this server (ROBERT_API_KEY is missing)"
// What a participant is told when Telescreen rejects their project. Never the fraud reviewer's note or score.
const PARTICIPANT_REJECTION_REASON = "it didn't pass our project verification checks. If you think this is a mistake, please ask in #alchemize-help"
const TELESCREEN_REJECTED = "Telescreen rejected this project's last review"
const SUPERSEDED_REASON = "Superseded: the participant shipped more time after this was submitted, so Alchemize submitted the project again for a fresh review"

const truncate = (value: string, length: number): string => (value.length > length ? value.slice(0, length) : value)

const parseLog = (raw: string | null | undefined): Log[] => {
	try {
		const log = JSON.parse(raw || "[]")
		return Array.isArray(log) ? log : []
	} catch {
		return []
	}
}

const parseDate = (value: unknown): Date | null => {
	if (typeof value !== "string") return null
	const time = Date.parse(value)
	return Number.isFinite(time) ? new Date(time) : null
}

const validTrustScore = (value: unknown): number | null =>
	Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 10 ? (value as number) : null

const isRobertState = (value: unknown): value is robert.RobertState =>
	robert.ROBERT_STATES.includes(value as robert.RobertState)

// Whether the submission saw all the time still waiting to be paid. Robert credits a project's Hackatime time once,
// shortly after it is submitted, so time shipped after submittedAt was never reviewed.
export const isUpToDate = (submission: Pick<TelescreenSubmission, "submittedAt">, log: Log[]): boolean => {
	const latestShip = latestUnpaidShipTime(log)
	if (!latestShip) return true
	return submission.submittedAt !== null && submission.submittedAt.getTime() >= latestShip.getTime()
}

// Mirrors what Robert reports about a project onto our row. An outcome we recorded ourselves is never overwritten.
const snapshotPatch = (row: TelescreenSubmission, project: robert.RobertProject) => ({
	...(isRobertState(project.state) ? { state: project.state } : {}),
	trustScore: validTrustScore(project.review?.trustScore ?? project.trustScore) ?? row.trustScore,
	reviewNote: typeof project.review?.note === "string" ? truncate(project.review.note, 5000) : row.reviewNote,
	reviewedAt: parseDate(project.review?.at) ?? row.reviewedAt,
	submittedAt: parseDate(project.submittedAt) ?? row.submittedAt,
	...(project.outcome && !row.outcomeStatus
		? {
			outcomeStatus: project.outcome.status,
			outcomeReason: typeof project.outcome.reason === "string" ? truncate(project.outcome.reason, 5000) : null,
			outcomeAt: parseDate(project.outcome.at),
			outcomeBy: "Telescreen",
			outcomeSource: "telescreen",
		}
		: {}),
})

// Robert resolves a submitter by Hackatime id more reliably than by Slack ID alone. Best effort: the public stats
// endpoint (also used by analyzeHackatime) maps the Slack ID to the Hackatime user id.
const lookupHackatimeId = async (slackId: string): Promise<number | null> => {
	try {
		const response = await fetch(`https://hackatime.hackclub.com/api/v1/users/${encodeURIComponent(slackId)}/stats`, {
			signal: AbortSignal.timeout(5_000),
		})
		if (!response.ok) return null
		const id = Number((await response.json())?.data?.user_id)
		return Number.isSafeInteger(id) && id > 0 ? id : null
	} catch {
		return null
	}
}

const refreshFromRobert = async (config: robert.TelescreenConfig, row: TelescreenSubmission): Promise<TelescreenSubmission> => {
	if (!row.robertProjectId) return row
	const fresh = await robert.getProject(config, row.robertProjectId)
	if (!fresh.ok) {
		console.warn(`Telescreen: could not refresh submission ${row.id}: ${fresh.message}`)
		return row
	}
	return settleRejection((await updateTelescreenSubmission(row.id, snapshotPatch(row, fresh.data))) ?? row)
}

// Telescreen's own rejection (fraud review, or an organizer in Robert's UI), as opposed to ours echoed back
const rejectedInTelescreen = (row: TelescreenSubmission): boolean =>
	row.state === "rejected_fraud" || (row.outcomeStatus === "rejected" && row.outcomeSource === "telescreen")

// Applies a Telescreen rejection to the project and ends the cycle as rejected, so neither a resubmission nor a
// super admin override gets around it. Throws when the project can't be updated right now.
const closeAsTelescreenRejection = async (row: TelescreenSubmission): Promise<TelescreenSubmission | null> => {
	const fraud = row.state === "rejected_fraud"
	await applyTelescreenRejection(row.projectId, fraud
		? `Rejected by Telescreen fraud review${row.trustScore ? ` (trust score ${row.trustScore})` : ""}`
		: "Rejected in Telescreen")
	return updateTelescreenSubmission(row.id, { closedAt: new Date(), closeReason: fraud ? "fraud_rejected" : "telescreen_rejected" })
}

// For every read of Robert's state: a rejection may reach us this way first (a webhook that never arrived, or a
// review scored before the webhook was set up; Robert doesn't replay those). Best effort, retried on the next read.
const settleRejection = async (row: TelescreenSubmission): Promise<TelescreenSubmission> => {
	if (row.closedAt || !rejectedInTelescreen(row)) return row
	try {
		return (await closeAsTelescreenRejection(row)) ?? row
	} catch (error) {
		console.error(`Telescreen: couldn't apply the rejection of project ${row.projectId} yet:`, error)
		return row
	}
}

// Takes a submission that is still open in Robert off its queue: deleted while unscored, otherwise rejected with
// `reason`. Returns the row changes to save and an error when Robert could not be updated.
const releaseInRobert = async (
	config: robert.TelescreenConfig,
	row: TelescreenSubmission,
	reason: string,
	actor: string
): Promise<{ patch: Partial<TelescreenSubmission>, error: string | null }> => {
	if (!row.robertProjectId) return { patch: {}, error: null }
	let state = row.state
	let patch: Partial<TelescreenSubmission> = {}
	if (state === "awaiting_review") {
		const deleted = await robert.deleteProject(config, row.robertProjectId, actor)
		if (deleted.ok || deleted.status === 404) return { patch: { state: "withdrawn" }, error: null }
		if (deleted.status !== 409) return { patch, error: deleted.message }
		// 409: a fraud reviewer scored it in the meantime, so it can no longer be deleted
		const fresh = await robert.getProject(config, row.robertProjectId)
		if (!fresh.ok) return { patch, error: fresh.message }
		patch = snapshotPatch(row, fresh.data)
		state = fresh.data.state
	}
	if (state === "awaiting_outcome") {
		const outcome = await robert.recordOutcome(config, row.robertProjectId, { status: "rejected", reason: truncate(reason, 5000) })
		if (outcome.ok) {
			return {
				patch: { ...patch, state: "decided", outcomeStatus: "rejected", outcomeReason: truncate(reason, 5000), outcomeAt: new Date(), outcomeBy: actor, outcomeSource: "alchemize" },
				error: null,
			}
		}
		// 409: another decision landed first; record whatever Robert has now
		if (outcome.status === 409) {
			const fresh = await robert.getProject(config, row.robertProjectId)
			if (fresh.ok && fresh.data.state !== "awaiting_outcome") return { patch: { ...patch, ...snapshotPatch(row, fresh.data) }, error: null }
		}
		return { patch, error: outcome.message }
	}
	// rejected_fraud, decided, withdrawn: final in Robert already
	return { patch, error: null }
}

export type TelescreenResult = { ok: true, submission: TelescreenSubmission } | { ok: false, message: string }

// Sends the project to Telescreen unless its open submission already covers everything waiting to be paid.
// Idempotent: a retry reuses the open submission's externalId, so Robert never gets a duplicate.
export const ensureTelescreenSubmission = async (projectId: number, actor: string): Promise<TelescreenResult> => {
	const config = telescreenConfig()
	if (!config) return { ok: false, message: NOT_CONFIGURED }
	const project = await getProjectForTelescreen(projectId)
	if (!project) return { ok: false, message: "Project not found" }
	const log = parseLog(project.log)

	// Resubmitting is no way around a Telescreen rejection: that needs time shipped after the rejected review
	const latest = await getLatestTelescreenSubmission(projectId)
	if (latest?.closedAt && isTelescreenRejection(latest) && isUpToDate(latest, log)) {
		return { ok: false, message: `${TELESCREEN_REJECTED}. It can only be sent again after the participant ships again` }
	}

	// Two passes at most: the second one replaces a stale record that an earlier, timed-out attempt left in Robert
	for (let pass = 0; pass < 2; pass++) {
		let row = await getOpenTelescreenSubmission(projectId)
		if (row?.robertProjectId) {
			if (isUpToDate(row, log)) return { ok: true, submission: row }
			const { patch, error } = await releaseInRobert(config, row, SUPERSEDED_REASON, actor)
			const released = (await updateTelescreenSubmission(row.id, { ...patch, lastError: error && truncate(error, 1000) })) ?? row
			// Robert rejected it before we heard: that verdict stands rather than being superseded
			if (rejectedInTelescreen(released)) {
				await settleRejection(released)
				return { ok: false, message: TELESCREEN_REJECTED }
			}
			await updateTelescreenSubmission(row.id, { closedAt: new Date(), closeReason: "superseded" })
			row = null
		}
		row ??= await openTelescreenSubmission(projectId)

		const submission = robert.buildSubmission(project, row.externalId, await lookupHackatimeId(project.slackId))
		if (typeof submission === "string") {
			await updateTelescreenSubmission(row.id, { lastError: submission })
			return { ok: false, message: submission }
		}
		const response = await robert.submitProject(config, submission)
		if (!response.ok || !robert.isUuid(response.data?.id)) {
			const message = response.ok ? "Telescreen returned no project id" : response.message
			await updateTelescreenSubmission(row.id, { lastError: truncate(message, 1000) })
			return { ok: false, message: `Couldn't send the project to Telescreen: ${message}` }
		}
		let patch: Partial<TelescreenSubmission> = {
			robertProjectId: response.data.id,
			state: isRobertState(response.data.state) ? response.data.state : "awaiting_review",
			submittedAt: response.data.created ? new Date() : null,
			lastError: null,
		}
		if (!response.data.created) {
			// Robert already had this externalId (an earlier attempt timed out after it arrived): read when that was
			const fresh = await robert.getProject(config, response.data.id)
			if (fresh.ok) patch = { ...patch, ...snapshotPatch({ ...row, ...patch } as TelescreenSubmission, fresh.data) }
		}
		const saved = await updateTelescreenSubmission(row.id, patch)
		if (!saved) return { ok: false, message: "The Telescreen submission disappeared while it was being saved" }
		if (rejectedInTelescreen(saved)) {
			await settleRejection(saved)
			return { ok: false, message: TELESCREEN_REJECTED }
		}
		if (isUpToDate(saved, log)) return { ok: true, submission: saved }
	}
	return { ok: false, message: "Telescreen still has an out-of-date review of this project, try again" }
}

// Ends the project's review cycle after a rejection in Alchemize (T1 or T2). Robert is updated best effort: a
// failure is stored in lastError and retried by `script/telescreen.ts sync`; the rejection itself never waits on it.
export const closeTelescreenSubmission = async (
	projectId: number,
	opts: { reason: string, actor: string, closeReason: string }
): Promise<{ ok: boolean, message: string | null }> => {
	const row = await getOpenTelescreenSubmission(projectId)
	if (!row) return { ok: true, message: null }
	const config = telescreenConfig()
	let patch: Partial<TelescreenSubmission> = {}
	let error: string | null = null
	if (row.robertProjectId) {
		if (config) {
			({ patch, error } = await releaseInRobert(config, row, opts.reason, opts.actor))
		} else {
			error = NOT_CONFIGURED
		}
	}
	// If Robert turns out to have rejected it already, record it as Telescreen's rejection so it can't be resent
	const merged = { ...row, ...patch } as TelescreenSubmission
	const closeReason = rejectedInTelescreen(merged)
		? merged.state === "rejected_fraud" ? "fraud_rejected" : "telescreen_rejected"
		: opts.closeReason
	await updateTelescreenSubmission(row.id, {
		...patch,
		closedAt: new Date(),
		closeReason,
		lastError: error && truncate(error, 1000),
	})
	if (error) console.warn(`Telescreen: project ${projectId} closed here but not in Telescreen: ${error}`)
	return { ok: !error, message: error }
}

// Retry for closeTelescreenSubmission failures (rows closed here that Robert still holds open)
export const retryRobertRelease = async (row: TelescreenSubmission): Promise<string | null> => {
	const config = telescreenConfig()
	if (!config) return NOT_CONFIGURED
	const reason = row.closeReason === "superseded" ? SUPERSEDED_REASON : `Closed in Alchemize (${row.closeReason ?? "rejected"})`
	const { patch, error } = await releaseInRobert(config, row, reason, "Alchemize")
	await updateTelescreenSubmission(row.id, { ...patch, lastError: error && truncate(error, 1000) })
	return error
}

export const refreshTelescreenSubmission = async (projectId: number): Promise<TelescreenSubmission | null> => {
	const row = await getOpenTelescreenSubmission(projectId)
	const config = telescreenConfig()
	if (!row || !config) return row
	return refreshFromRobert(config, row)
}

// Robert sends no webhook when a project passes fraud review, so submissions still awaiting review are matched
// against Robert's awaiting_outcome list (for the T2 queue), and against rejected_fraud in case a rejection webhook
// was missed. Best effort: failures leave the stored state.
export const refreshAwaitingReview = async (): Promise<void> => {
	const config = telescreenConfig()
	if (!config) return
	const waiting = await getTelescreenSubmissionsInStates(["awaiting_review"], true)
	const byRobertId = new Map(waiting.filter(row => row.robertProjectId).map(row => [row.robertProjectId!, row]))
	if (byRobertId.size === 0) return
	const pageSize = 100
	for (const state of ["awaiting_outcome", "rejected_fraud"] as const) {
		for (let offset = 0; offset < 5_000; offset += pageSize) {
			const page = await robert.listProjects(config, { state, limit: pageSize, offset })
			if (!page.ok || !Array.isArray(page.data?.projects)) {
				console.warn(`Telescreen: could not list ${state} projects: ${page.ok ? "bad response" : page.message}`)
				return
			}
			for (const project of page.data.projects) {
				const row = byRobertId.get(project.id)
				if (!row) continue
				const updated = await updateTelescreenSubmission(row.id, snapshotPatch(row, project))
				if (updated) await settleRejection(updated)
			}
			if (page.data.projects.length < pageSize || offset + pageSize >= page.data.total) break
		}
	}
}

// Closed because Telescreen rejected it (fraud review, or an organizer in Robert's UI)
export const isTelescreenRejection = (row: Pick<TelescreenSubmission, "closeReason">): boolean =>
	row.closeReason === "fraud_rejected" || row.closeReason === "telescreen_rejected"

export type ApprovalResult =
	| { ok: true }
	// overridable: a super admin may approve anyway with a reason (Telescreen has not given a verdict)
	| { ok: false, status: number, message: string, overridable: boolean }

// The T2 approval gate. Passes when Telescreen's fraud review cleared the project (awaiting our outcome, or already
// approved in Telescreen) and saw all the time being paid; the approval is then recorded in Telescreen before
// anything is paid, so a fraud rejection that lands at the same moment wins (Robert answers 409). A super admin can
// override only while Telescreen has no verdict (not configured, unreachable, unsent, unscored, out of date), never
// a rejection.
export const approveInTelescreen = async (
	projectId: number,
	log: Log[],
	reviewer: { name: string, isSuperAdmin: boolean },
	decisionReason: string,
	overrideReason: string | undefined
): Promise<ApprovalResult> => {
	const config = telescreenConfig()
	let row = await getOpenTelescreenSubmission(projectId)

	const blocked = async (message: string, overridable: boolean, status = 409): Promise<ApprovalResult> => {
		if (!overridable || overrideReason === undefined) {
			return { ok: false, status, message, overridable: overridable && reviewer.isSuperAdmin }
		}
		if (!reviewer.isSuperAdmin) {
			return { ok: false, status: 403, message: "Only a super admin can approve without a Telescreen verdict", overridable: false }
		}
		const reason = overrideReason.trim()
		if (reason.length < 20) {
			return { ok: false, status: 400, message: "Explain the Telescreen override in at least 20 characters", overridable: true }
		}
		row ??= await openTelescreenSubmission(projectId)
		await updateTelescreenSubmission(row.id, { overrideBy: reviewer.name, overrideReason: truncate(reason, 2000), overrideAt: new Date() })
		console.warn(`Telescreen: ${reviewer.name} approved project ${projectId} without a Telescreen verdict (${message}): ${reason}`)
		return { ok: true }
	}

	// A cycle Telescreen rejected stays rejected: T1-approved time left over from it is only paid after the
	// participant ships again and a new review passes
	if (!row) {
		const latest = await getLatestTelescreenSubmission(projectId)
		if (latest && isTelescreenRejection(latest)) return blocked("Telescreen rejected this project's last review. It needs a new ship and a new review", false)
	}
	if (!config) return blocked(NOT_CONFIGURED, true)
	if (!row?.robertProjectId) {
		return blocked(`This project hasn't been sent to Telescreen yet${row?.lastError ? ` (${row.lastError})` : ""}. Send it from the Telescreen panel.`, true)
	}
	if (row.state === "awaiting_review") row = await refreshFromRobert(config, row)
	if (!isUpToDate(row, log)) {
		return blocked("The participant shipped more time after this was sent to Telescreen, so its review is out of date. Send it again from the Telescreen panel.", true)
	}
	switch (row.state) {
		case "rejected_fraud":
			return blocked(`Telescreen's fraud review rejected this project${row.trustScore ? ` (trust score ${row.trustScore})` : ""}`, false)
		case "decided":
			return row.outcomeStatus === "approved"
				? { ok: true }
				: blocked("This project was rejected in Telescreen", false)
		case "awaiting_review":
			return blocked("Telescreen's fraud review of this project hasn't finished yet", true)
		case "awaiting_outcome":
			break
		default:
			return blocked(`This project isn't waiting on a decision in Telescreen (${row.state})`, true)
	}

	const reason = decisionReason.trim()
	const outcome = await robert.recordOutcome(config, row.robertProjectId!, { status: "approved", ...(reason ? { reason: truncate(reason, 5000) } : {}) })
	if (outcome.ok) {
		await updateTelescreenSubmission(row.id, {
			state: "decided", outcomeStatus: "approved", outcomeReason: reason ? truncate(reason, 5000) : null,
			outcomeAt: new Date(), outcomeBy: reviewer.name, outcomeSource: "alchemize", lastError: null,
		})
		return { ok: true }
	}
	if (outcome.status === 409) {
		// Something landed first (a retry of this approval, a fraud rejection, a decision in Robert): go by what Robert has now
		const fresh = await robert.getProject(config, row.robertProjectId!)
		if (fresh.ok) {
			const saved = await settleRejection((await updateTelescreenSubmission(row.id, snapshotPatch(row, fresh.data))) ?? row)
			if (fresh.data.outcome?.status === "approved") return { ok: true }
			if (saved.state === "rejected_fraud" || fresh.data.outcome?.status === "rejected") {
				return blocked("Telescreen rejected this project while you were reviewing it", false)
			}
		}
		return blocked(`Telescreen refused the approval: ${outcome.message}`, false)
	}
	// No answer or a server error: nothing was recorded or paid
	return blocked(`Couldn't record the approval in Telescreen: ${outcome.message}`, outcome.status === 0 || outcome.status >= 500, 502)
}

const notifyParticipantOfRejection = async (project: { slackId: string, Name: string, code: string | null }) => {
	try {
		const response = await fetch("https://notifications.alchemize.hackclub.com/review-reject", {
			method: "POST",
			headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.BOT_AUTH ?? ""}` },
			body: JSON.stringify({
				user_id: project.slackId,
				project_name: project.Name,
				project_link: project.code ?? "",
				reviewer_id: "",
				feedback: PARTICIPANT_REJECTION_REASON,
			}),
			signal: AbortSignal.timeout(10_000),
		})
		if (!response.ok) console.warn(`Telescreen: rejection notification for ${project.slackId} failed with ${response.status}`)
	} catch (error) {
		console.warn("Telescreen: rejection notification failed:", (error as Error).message)
	}
}

// Applies a rejection made in Telescreen to the project, like a T2 return. Throws when the project can't be updated
// right now (e.g. a Unified submission is in flight), so the webhook answers 500 and Robert retries later.
const applyTelescreenRejection = async (projectId: number, internalNote: string): Promise<boolean> => {
	for (let attempt = 0; attempt < 3; attempt++) {
		const project = await getProjectForTelescreen(projectId)
		if (!project) return false
		const log = parseLog(project.log)
		const updated = applyT2Reject(log, PARTICIPANT_REJECTION_REASON, new Date(), { internalNote, reviewerName: "Telescreen" })
		// Nothing pending or approved-and-unpaid to reject
		if (updated === log) return false
		const response = await patchProjectForShip(String(projectId), project.log, updated, "rejected")
		if (response.ok) {
			await notifyParticipantOfRejection(project)
			return true
		}
		if (response.status !== 409) throw new Error(`could not reject project ${projectId}: ${(await response.json()).message}`)
	}
	throw new Error(`project ${projectId} is busy (changed repeatedly, or a Unified submission is in flight)`)
}

// outcome.set webhook: a final outcome in Telescreen. Our own decisions come back as an echo and change nothing.
// A rejection made in Telescreen (fraud score 4 or below, or an organizer in Robert's UI) is applied to the project;
// an approval made in Robert's UI is only recorded, and a T2 reviewer still decides whether to pay.
export const handleOutcomeWebhook = async (payload: any): Promise<"ignored" | "recorded" | "rejected"> => {
	const robertProjectId = payload?.projectId
	const outcome = payload?.outcome
	if (!robert.isUuid(robertProjectId) || (outcome?.status !== "approved" && outcome?.status !== "rejected")) {
		console.warn("Telescreen webhook: outcome.set without a valid projectId or outcome, ignored")
		return "ignored"
	}
	const row = await findTelescreenSubmissionByRobertId(robertProjectId)
	if (!row) {
		console.warn(`Telescreen webhook: outcome for unknown Telescreen project ${robertProjectId}, ignored`)
		return "ignored"
	}
	const status = outcome.status as "approved" | "rejected"
	const trustScore = validTrustScore(outcome.trustScore)
	// An organizer can't decide a project scored 4 or below, so a rejection with such a score is the fraud review's
	const fraud = status === "rejected" && trustScore !== null && trustScore <= 4
	const reason = typeof outcome.reason === "string" ? truncate(outcome.reason, 5000) : null
	const decidedAt = parseDate(outcome.reviewedAt) ?? new Date()
	const ownEcho = row.outcomeSource === "alchemize" && row.outcomeStatus === status
	if (row.outcomeStatus && row.outcomeStatus !== status) {
		console.error(`Telescreen webhook: project ${row.projectId} has outcome ${row.outcomeStatus} here but ${status} in Telescreen`)
	}

	const updated = await updateTelescreenSubmission(row.id, {
		state: fraud ? "rejected_fraud" : "decided",
		trustScore: trustScore ?? row.trustScore,
		...(fraud ? { reviewNote: reason ?? row.reviewNote, reviewedAt: decidedAt } : {}),
		...(!row.outcomeStatus
			? {
				outcomeStatus: status,
				outcomeReason: reason,
				outcomeAt: decidedAt,
				outcomeBy: fraud ? "Telescreen fraud review" : typeof outcome.reviewerName === "string" ? truncate(outcome.reviewerName, 255) : "Telescreen",
				outcomeSource: "telescreen",
			}
			: {}),
	})

	if (ownEcho || status === "approved") return "recorded"
	if (row.closedAt) {
		// The cycle already ended here (paid, superseded or rejected); nothing left to apply
		if (row.closeReason === "awarded") {
			console.error(`Telescreen webhook: project ${row.projectId} was rejected in Telescreen after it was paid (super admin override?)`)
		}
		return "recorded"
	}
	// Throws if the project can't be updated now: the webhook answers 500 and Robert retries
	await closeAsTelescreenRejection(updated ?? row)
	return "rejected"
}

export const toTelescreenView = (row: TelescreenSubmission | null | undefined, log: Log[]): TelescreenView | null =>
	row
		? {
			state: row.state as TelescreenView["state"],
			robertProjectId: row.robertProjectId,
			submittedAt: row.submittedAt?.toISOString() ?? null,
			upToDate: isUpToDate(row, log),
			trustScore: row.trustScore,
			reviewNote: row.reviewNote,
			reviewedAt: row.reviewedAt?.toISOString() ?? null,
			outcomeStatus: row.outcomeStatus as TelescreenView["outcomeStatus"],
			outcomeReason: row.outcomeReason,
			outcomeBy: row.outcomeBy,
			outcomeSource: row.outcomeSource as TelescreenView["outcomeSource"],
			overrideBy: row.overrideBy,
			overrideReason: row.overrideReason,
			closed: row.closedAt !== null,
			closeReason: row.closeReason,
			lastError: row.lastError,
		}
		: null
