// Project log math shared by ship (user), T1 accept/reject and T2 award/reject.
// Pure functions only, with no $env/$lib imports, so testing/manualTests/test-projectLog.ts can run them directly.
import type { Log, message } from "../types"

// Minutes the user claimed for an entry: what is left after reviews plus what reviewers deducted.
// Ship deltas are measured against this, so deducted time can never be claimed a second time.
export const claimedMinutes = (entry: Log): number => entry.deltaTime + (entry.deductedMinutes ?? 0)

export const calculateRecordedTime = (log: Log[]): number =>
	log.reduce((total, entry) => total + claimedMinutes(entry), 0)

// New Hackatime minutes since everything already recorded on this project (may be negative if the
// Hackatime total went down, e.g. heartbeats removed; callers must refuse that)
export const calculateShipDelta = (hackatimeMinutes: number, log: Log[]): number =>
	hackatimeMinutes - calculateRecordedTime(log)

const userMessage = (changelog: string, timestamp: string): message => ({
	userExternal: changelog,
	internalNote: "",
	justification: "",
	timestamp,
	reviewerName: "user",
})

// A ship either opens a new pending entry (empty log, or the last entry was approved) or folds the new
// time into the last entry when it is still pending or was rejected.
export const applyShip = (log: Log[], deltaTime: number, changelog: string, now = new Date()): Log[] => {
	const timestamp = now.toISOString()
	const freshEntry: Log = {
		status: 0,
		timestamp,
		deltaTime,
		message: [userMessage(changelog, timestamp)],
		submmitedToHQ: false,
		fraudApproved: false,
		fraudApprovedBy: undefined,
		fraudJustification: undefined,
		fraudTimestamp: undefined,
	}
	const lastLog = log.at(-1)
	if (!lastLog || lastLog.status === 1) {
		return [...log, freshEntry]
	}
	if (lastLog.status === 0 || lastLog.status === 2) {
		return [
			...log.slice(0, -1),
			{
				...lastLog,
				status: 0,
				timestamp,
				deltaTime: lastLog.deltaTime + deltaTime,
				message: [...lastLog.message, userMessage(changelog, timestamp)],
				submmitedToHQ: false,
				fraudApproved: false,
				fraudApprovedBy: undefined,
				fraudJustification: undefined,
				fraudTimestamp: undefined,
			},
		]
	}
	return log
}

// T1 "Deduct hours" arrives in hours (null when the input is left empty); log deltas are in minutes.
// Returns the minutes to deduct from the last entry, or an error message.
export const parseDeductionMinutes = (decreaseTime: unknown, lastLog: Log | undefined, decision: "accept" | "reject"): number | string => {
	const hours = decreaseTime ?? 0
	if (typeof hours !== "number" || !Number.isFinite(hours) || hours < 0) {
		return "Deducted hours must be a non-negative number"
	}
	if (!lastLog) {
		return "Project has no log to review"
	}
	if (lastLog.submmitedToHQ) {
		return "This entry has already been sent to HQ and cannot be reviewed again"
	}
	if (decision === "accept" && lastLog.deltaTime < 0) {
		return "This review has negative time (the Hackatime total went down), it can only be rejected"
	}
	const minutes = Math.round(hours * 60)
	const available = Math.max(lastLog.deltaTime, 0)
	if (minutes > available) {
		return `Cannot deduct ${hours}h, this review's delta is only ${(available / 60).toFixed(2)}h`
	}
	return minutes
}

// T1 decision on the last entry: lowers its delta by the deduction and remembers the deduction
export const applyT1Review = (
	log: Log[],
	deductMinutes: number,
	decision: "accept" | "reject",
	review: { userExternal: string, internalNote: string, justification: string, reviewerName: string },
	now = new Date()
): Log[] => {
	const lastLog = log.at(-1)
	if (!lastLog) {
		throw new Error("Log is empty")
	}
	const timestamp = now.toISOString()
	return [...log.slice(0, -1), {
		...lastLog,
		status: decision === "accept" ? 1 : 2,
		timestamp,
		deltaTime: lastLog.deltaTime - deductMinutes,
		deductedMinutes: (lastLog.deductedMinutes ?? 0) + deductMinutes,
		message: [...lastLog.message, {
			userExternal: review.userExternal,
			internalNote: review.internalNote,
			justification: review.justification,
			timestamp,
			reviewerName: decision === "accept" ? `APPROVED ${review.reviewerName}` : review.reviewerName,
		}],
		submmitedToHQ: false,
	}]
}

// T2 rejection sends the last T1-approved (or pending) entry back as rejected; anything else is unchanged
export const applyT2Reject = (log: Log[], rejectionReason: string, now = new Date()): Log[] => {
	const lastLog = log.at(-1)
	if (!lastLog || (lastLog.status !== 0 && lastLog.status !== 1) || lastLog.submmitedToHQ) {
		return log
	}
	const timestamp = now.toISOString()
	return [...log.slice(0, -1), {
		...lastLog,
		status: 2,
		timestamp,
		message: [...lastLog.message, {
			userExternal: `Hiya! Your project failed T2 review, REASON: ${rejectionReason}`,
			internalNote: "Rejected at T2",
			justification: "Rejected at T2",
			timestamp,
			reviewerName: "T2 Reviewer",
		}],
		submmitedToHQ: false,
	}]
}

// Minutes approved by T1 that have not been sent to Unified yet
export const calculateNewMinutes = (log: Log[]): number =>
	log.reduce((total, entry) => entry.status === 1 && !entry.submmitedToHQ ? total + entry.deltaTime : total, 0)

export const hasUnpushedApprovedEntries = (log: Log[]): boolean =>
	log.some(entry => entry.status === 1 && !entry.submmitedToHQ)

// T2 award: marks every approved entry as sent to HQ and appends the award marker
export const applyT2Award = (log: Log[], justification: string, reviewerName: string, now = new Date()): Log[] => {
	const timestamp = now.toISOString()
	return [
		...log.map(entry => entry.status === 1 && !entry.submmitedToHQ ? { ...entry, submmitedToHQ: true } : entry),
		{
			status: 1,
			timestamp,
			deltaTime: 0,
			message: [{ userExternal: "Currency Awarded", internalNote: "Project sent to Unified", justification, timestamp, reviewerName: "T2 " + reviewerName }],
			submmitedToHQ: true,
			fraudApproved: false,
		},
	]
}

// Reviewers may not review or pay out their own projects. Compared on both Slack ID and email, because
// the admins table and the users table are maintained separately.
export const isOwnProject = (
	reviewer: { slackId?: string | null, email?: string | null },
	project: { slackId?: string | null, owner?: string | null }
): boolean => {
	const sameSlack = !!reviewer.slackId && !!project.slackId && reviewer.slackId === project.slackId
	const sameEmail = !!reviewer.email && !!project.owner && reviewer.email.trim().toLowerCase() === project.owner.trim().toLowerCase()
	return sameSlack || sameEmail
}

// Hackatime project values may hold a comma-separated list (analyzeHackatime splits on ",")
export const hackatimeProjectNames = (value: string | null | undefined): string[] =>
	(value ?? "").split(",").map(name => name.trim()).filter(Boolean)

export const sharesHackatimeProject = (a: string | null | undefined, b: string | null | undefined): boolean => {
	const names = new Set(hackatimeProjectNames(a))
	return hackatimeProjectNames(b).some(name => names.has(name))
}
