<script lang="ts">
	import ProjectDetailsDialog from "$lib/components/projectdetails-dialog.svelte"
	import Button from "$lib/components/ui/button/button.svelte"
	import Input from "$lib/components/ui/input/input.svelte"
	import Textarea from "$lib/components/ui/textarea/textarea.svelte"
	import * as Dialog from "$lib/components/ui/dialog"
	import type {
		Project,
		Log,
		AirtableProject,
		HackatimeAnalysis,
		TelescreenPastReview,
		TelescreenView,
	} from "$lib/types"
	import { toast } from "svelte-sonner"
	import { invalidateAll } from "$app/navigation"
	import { readErrorMessage } from "$lib/http"
	import { Info } from "lucide-svelte"
	import { safeHref } from "$lib/urls"
	import { countCharacters } from "$lib/utils"
	import { cn } from "$lib/lib/utils"
	import { buildBillyUrl, buildJoeFraudUrl, HACKATIME_REVIEW_START_DATE, totalLogMinutes } from "$lib/reviewTools"
	import { tick } from "svelte"
	import { BarController, BarElement, CategoryScale, Chart, Legend, LinearScale, Title, Tooltip } from "chart.js"
	type AdminProjectAccess = AirtableProject & { telescreen: TelescreenView | null }
	type AdminProject = Project
	let detailsOpen = $state(false)
	let currentHackatimeAnalysis = $state({} as HackatimeAnalysis)
	let { data } = $props()
	let airtableProjects = $derived(data.projects as AdminProjectAccess[])
	let justificationOpen = $state(false)
	let daySummaryChart = $state<HTMLCanvasElement | undefined>(undefined)
	let daySummaryChartInstance: Chart<"bar"> | null = null
	Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title)
	const wasEverApproved = (project: AirtableProject) => {
		//Checks the logs and returns true if there was ever an approved log, that is not sent to airtable (aka not pushed)
		const logs = JSON.parse(project.fields.log || "[]") as Log[]
		return logs.some(log => log.status === 1)
	}
	let currentProject = $state({} as AdminProject)
	const renderBar = () => {
		if (!daySummaryChart || !currentHackatimeAnalysis?.dayMap) {
			return
		}
		const dataLabels = []
		const dataValues = []
		for (const [key, value] of Object.entries(currentHackatimeAnalysis.dayMap)) {
			dataLabels.push(key)
			dataValues.push(Math.round((value / 3600) * 10) / 10)
		}
		const configs = {
			type: "bar",
			data: {
				labels: dataLabels,
				datasets: [
					{
						label: "Time spent (hours)",
						data: dataValues,
						backgroundColor: "#4ade80",
					},
				],
			},
		}
		daySummaryChartInstance?.destroy()
		daySummaryChartInstance = new Chart(daySummaryChart, {
			type: "bar",
			data: configs.data,
			options: {
				indexAxis: "y",
				plugins: {
					tooltip: {
						callbacks: {
							label: context => `${context.parsed.x} hrs`,
						},
					},
				},
			},
		})
	}
	const fetchHackatimeAnalysis = async (projectId: string) => {
		const response = await fetch(`/admin/review2/analyzeHackatime`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				projectId,
			}),
		})
		const data = await response.json()
		currentHackatimeAnalysis = data
		await tick()
		renderBar()
		generateFullJustification()
		fullTimeRange()
	}

	const setCurrentProject = (nextProject: AdminProjectAccess) => {
		currentProject = {
			id: nextProject.id,
			name: nextProject.fields.Name,
			hours: Math.floor((totalLogMinutes(JSON.parse(nextProject.fields.log ?? "[]") as Log[]) * 10) / 60) / 10,
			submittedBy: nextProject.fields.slackId,
			type: nextProject.fields.type,
			category: nextProject.fields.Theme,
			description: nextProject.fields.description,
			log: JSON.parse(nextProject.fields.log ?? "[]") as Log[],
			demo: nextProject.fields.demo,
			code: nextProject.fields.code,
			readme: nextProject.fields.code,
			update: nextProject.fields.update,
			hackatime: nextProject.fields.hackatime,
			screenshot2: nextProject.fields.screenshot2,
			screenshot: nextProject.fields.screenshot,
		}
		currentTelescreen = nextProject.telescreen
		telescreenPastReviews = []
		loadTelescreenReview(nextProject.id)
		decisionReason = ""
		overrideEnabled = false
		overrideReason = ""
		currentHackatimeAnalysis = {} as HackatimeAnalysis
		fetchHackatimeAnalysis(currentProject.id + "")
	}

	// Telescreen (Robert) fraud review of the selected project. The server enforces the same gate on push.
	let currentTelescreen = $state<TelescreenView | null>(null)
	let decisionReason = $state("")
	let overrideEnabled = $state(false)
	let overrideReason = $state("")
	let telescreenBusy = $state(false)
	let telescreenPastReviews = $state<TelescreenPastReview[]>([])
	// Every Telescreen request (opening a project, Refresh, Send) takes a number; only the latest started one updates
	// the panel, so a slow automatic read can't overwrite a newer manual result, or another project's
	let latestTelescreenRequest = 0
	// Robert's trust score bands: 1-4 fraud, 5-7 doubtful (usually a deduction), 8-10 clean
	const trustBand = (score: number | null | undefined) => {
		if (score == null) return null
		if (score <= 4)
			return {
				label: "Fraud",
				chip: "bg-rose-500/10 text-rose-300 border-rose-500/30",
				callout: "border-rose-500/40 bg-rose-500/5",
			}
		if (score <= 7)
			return {
				label: "Doubtful",
				chip: "bg-amber-500/10 text-amber-300 border-amber-500/30",
				callout: "border-amber-500/40 bg-amber-500/5",
			}
		return {
			label: "Clean",
			chip: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
			callout: "border-emerald-500/30 bg-emerald-500/5",
		}
	}
	const TELESCREEN_CLOSE_LABELS: Record<string, string> = {
		awarded: "Paid",
		fraud_rejected: "Fraud rejected",
		telescreen_rejected: "Rejected in Telescreen",
		t1_rejected: "Returned by T1",
		t2_rejected: "Returned by T2",
		superseded: "Superseded",
	}
	const isTelescreenRejection = (closeReason: string | null): boolean =>
		closeReason === "fraud_rejected" || closeReason === "telescreen_rejected"
	const formatTelescreenDate = (iso: string | null): string =>
		iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : ""
	// On opening a project: the review as Telescreen has it now (a note written there since the queue loaded shows
	// up), plus the earlier reviews. If Telescreen doesn't answer, the server returns the stored copy.
	const loadTelescreenReview = async (projectId: string) => {
		const request = ++latestTelescreenRequest
		const response = await fetch("/admin/review2/telescreen", {
			method: "POST",
			headers: { "Content-Type": "application/json", Accept: "application/json" },
			body: JSON.stringify({ projectId, action: "refresh" }),
		}).catch(() => null)
		if (!response?.ok) return
		const result = await response.json()
		if (request !== latestTelescreenRequest) return
		if (result.telescreen) currentTelescreen = result.telescreen
		telescreenPastReviews = result.pastReviews ?? []
	}
	type TelescreenGate = { ok: boolean; overridable: boolean; message: string }
	const telescreenGateFor = (t: TelescreenView | null): TelescreenGate => {
		if (!data.telescreenConfigured)
			return { ok: false, overridable: true, message: "Telescreen isn't configured on this server" }
		if (t?.closed && isTelescreenRejection(t.closeReason))
			return {
				ok: false,
				overridable: false,
				message: "Telescreen rejected this project's last review. It needs a new ship and a new review.",
			}
		if (!t || t.closed || !t.robertProjectId)
			return {
				ok: false,
				overridable: true,
				message: t?.lastError && !t.closed ? `Not sent to Telescreen: ${t.lastError}` : "Not sent to Telescreen yet",
			}
		if (!t.upToDate)
			return {
				ok: false,
				overridable: true,
				message: "Out of date: the participant shipped more time after this was sent to Telescreen. Send it again.",
			}
		switch (t.state) {
			case "awaiting_outcome":
				return { ok: true, overridable: false, message: "" }
			case "decided":
				return t.outcomeStatus === "approved"
					? { ok: true, overridable: false, message: "" }
					: { ok: false, overridable: false, message: "Rejected in Telescreen" }
			case "rejected_fraud":
				return { ok: false, overridable: false, message: "Rejected by Telescreen's fraud review" }
			case "awaiting_review":
				return { ok: false, overridable: true, message: "Waiting on Telescreen's fraud review" }
			default:
				return { ok: false, overridable: true, message: "Not waiting on a decision in Telescreen" }
		}
	}
	let telescreenGate = $derived(telescreenGateFor(currentTelescreen))
	let overrideActive = $derived(
		data.isSuperAdmin && !telescreenGate.ok && telescreenGate.overridable && overrideEnabled
	)
	let canPush = $derived(telescreenGate.ok || (overrideActive && overrideReason.trim().length >= 20))
	// A review Telescreen rejected can't be resent until the participant ships again (the server refuses too)
	const telescreenNeedsSubmit = (t: TelescreenView | null): boolean =>
		!t ||
		(t.closed && !(isTelescreenRejection(t.closeReason) && t.upToDate)) ||
		(!t.closed && (t.state === "unsent" || !t.upToDate))
	const telescreenLabel = (t: TelescreenView | null): string => {
		if (!t) return "Not sent"
		if (t.closed) return TELESCREEN_CLOSE_LABELS[t.closeReason ?? ""] ?? "Closed"
		const label = {
			unsent: t.lastError ? "Send failed" : "Not sent",
			awaiting_review: "Awaiting fraud review",
			awaiting_outcome: "Passed fraud review",
			rejected_fraud: "Fraud rejected",
			decided: t.outcomeStatus === "approved" ? "Approved in Telescreen" : "Rejected in Telescreen",
			withdrawn: "Withdrawn",
		}[t.state]
		return t.upToDate || t.state === "unsent" ? label : `${label} · out of date`
	}
	const telescreenBadgeClass = (t: TelescreenView | null): string => {
		const gate = telescreenGateFor(t)
		if (gate.ok) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
		if (!gate.overridable) return "bg-rose-500/10 text-rose-400 border-rose-500/20"
		return "bg-amber-500/10 text-amber-400 border-amber-500/20"
	}
	const telescreenAction = async (action: "refresh" | "submit") => {
		const projectId = currentProject.id
		const request = ++latestTelescreenRequest
		telescreenBusy = true
		const response = await fetch("/admin/review2/telescreen", {
			method: "POST",
			headers: { "Content-Type": "application/json", Accept: "application/json" },
			body: JSON.stringify({ projectId, action }),
		}).catch(() => null)
		telescreenBusy = false
		if (!response?.ok) {
			toast.error(
				response ? await readErrorMessage(response, "Telescreen request failed") : "Telescreen request failed"
			)
			return
		}
		const result = await response.json()
		if (request === latestTelescreenRequest) {
			currentTelescreen = result.telescreen
			telescreenPastReviews = result.pastReviews ?? []
		}
		if (result.ok) {
			toast.success(action === "submit" ? "Sent to Telescreen" : "Telescreen state refreshed")
		} else {
			toast.error(result.message ?? "Telescreen request failed")
		}
		invalidateAll()
	}
	const calculateDelta = (log: Log[], includePushed = false): number => {
		let delta = 0
		for (const entry of log) {
			if (entry.status === 1 && (includePushed || !entry.submmitedToHQ)) {
				delta += entry.deltaTime
			}
		}
		return Math.floor(delta / 60)
	}
	// The push-to-HQ action appends a synthetic "Currency Awarded" log entry —
	// skip it when rebuilding the review history.
	const isSyntheticPushEntry = (entry: Log): boolean =>
		entry.deltaTime === 0 && entry.message.length === 1 && entry.message[0]?.userExternal === "Currency Awarded"
	const cleanReviewerName = (name?: string): string => (name ?? "unknown").replace(/^APPROVED\s+/i, "")
	const buildReviewLog = (log: Log[], includePushed: boolean): string => {
		const blocks: string[] = []
		let reviewNumber = 0
		for (const entry of log) {
			if (entry.status !== 1) continue
			if (!includePushed && entry.submmitedToHQ) continue
			if (isSyntheticPushEntry(entry)) continue
			reviewNumber++
			const lastMessage = entry.message.at(-1)
			const lines: string[] = [
				`--- Review ${reviewNumber} · delta ${Math.floor(entry.deltaTime / 60)}h · ${entry.timestamp?.slice(0, 10) || "unknown date"} ---`,
			]
			entry.message.forEach((msg, index) => {
				const text = (msg.userExternal ?? "").trim()
				if (!text) return
				if (msg.reviewerName === "user") {
					lines.push(`User devlog: ${text}`)
				} else if (index !== entry.message.length - 1) {
					// The final reviewer message is shown once below as the approval feedback
					lines.push(`Reviewer note (${cleanReviewerName(msg.reviewerName)}): ${text}`)
				}
			})
			lines.push(`Approval feedback: ${lastMessage?.userExternal?.trim() || "No feedback provided"}`)
			lines.push(`Approved by T1 reviewer: ${cleanReviewerName(lastMessage?.reviewerName)}`)
			blocks.push(lines.join("\n"))
		}
		return blocks.length > 0 ? blocks.join("\n\n") : "No approved review entries found."
	}

	let template = $state("")
	let range = $state("")
	let loader = $state(false)
	const secsToHours = (secs: number): number => Math.round(secs / 360) / 10
	const hackatimeDays = () => Object.keys(currentHackatimeAnalysis?.dayMap ?? {})
	const reviewRange = () => {
		const days = hackatimeDays()
		return {
			start: days.at(0) ?? HACKATIME_REVIEW_START_DATE,
			end: days.at(-1) ?? new Date().toISOString().slice(0, 10),
		}
	}
	const generateFullJustification = (opts?: { includePushed?: boolean }) => {
		const includePushed = opts?.includePushed === true
		const analysis = currentHackatimeAnalysis
		const { start, end } = reviewRange()
		const delta = calculateDelta(currentProject.log, includePushed)
		const awarded = Math.max(delta - subtraction, 0)
		const isUpdate = Boolean(currentProject.update) || currentProject.log.length > 1

		const sections: string[] = []
		sections.push(
			[
				`[SUMMARY]`,
				`- Project: ${currentProject.name} (${currentProject.type} · ${currentProject.category})`,
				`- Submission: ${isUpdate ? "update to an existing project" : "first submission of this project"}`,
				`- Total tracked on Alchemize: ${currentProject.hours}h on Hackatime project "${currentProject.hackatime}"`,
				``,
				`Reviewer summary:`,
				projectDescription || "—",
			].join("\n")
		)
		sections.push(
			[
				`[HOURS]`,
				`- Delta approved this review: ${delta}h`,
				`- Hours deducted: ${subtraction > 0 ? `Yes — ${subtraction}h` : "No"}`,
				`- Hours awarded: ${awarded}h`,
				...(subtraction > 0 ? [`- Deduction reason: ${reasonForOverride || "—"}`] : []),
			].join("\n")
		)
		const trustLabel = analysis?.trustFactor?.trustLevel
			? `${analysis.trustFactor.trustLevel}${analysis.trustFactor.trustValue !== null ? ` (${analysis.trustFactor.trustValue})` : ""}`
			: "unknown"
		const hackatimeLines = [
			`[HACKATIME]`,
			`- Hackatime project(s): ${currentProject.hackatime}`,
			`- Hackatime user ID: ${analysis?.hackatimeUserId ?? "unknown"}`,
			`- Trust factor: ${trustLabel}`,
			`- Reviewed range: ${start} to ${end}`,
		]
		if (analysis?.aiSec !== undefined) {
			hackatimeLines.push(
				`- Category breakdown: coding ${secsToHours(analysis.codingSec)}h · AI ${secsToHours(analysis.aiSec)}h · building ${secsToHours(analysis.buildingSec)}h · timelapsing ${secsToHours(analysis.timelapsingSec)}h · other ${secsToHours(analysis.others)}h`
			)
		}
		sections.push(hackatimeLines.join("\n"))
		sections.push(
			[
				`[GIT]`,
				`- Repository: ${currentProject.code || "—"}`,
				`- Commits: ${gitCommits}${gitCommits > 0 && currentProject.hours > 0 ? ` (≈${Math.floor((gitCommits / currentProject.hours) * 10) / 10} commits/hr)` : ""}`,
			].join("\n")
		)
		if (isUpdate && changelogs) {
			sections.push(`[CHANGELOG]\n${changelogs}`)
		}
		sections.push(`[REVIEW LOG]\n${buildReviewLog(currentProject.log, includePushed)}`)
		const linkLines = [`[LINKS]`, `- Demo: ${currentProject.demo || "—"}`, `- Repo: ${currentProject.code || "—"}`]
		if (analysis?.hackatimeUserId) {
			linkLines.push(`- Billy: ${buildBillyUrl(analysis.hackatimeUserId, start, end)}`)
			linkLines.push(`- Joe.fraud: ${buildJoeFraudUrl(analysis.hackatimeUserId, start, end)}`)
		}
		sections.push(linkLines.join("\n"))
		sections.push(
			[
				`[SIGN-OFF]`,
				`- Signed by ${data.name}, T2 Reviewer (Alchemize)`,
				`- Generated at: ${new Date().toISOString()}`,
				...(includePushed ? [`- Note: regenerated after this project was pushed to HQ`] : []),
			].join("\n")
		)
		template = sections.join("\n\n")
	}

	const fullTimeRange = () => {
		const days = hackatimeDays()
		if (days.length === 0) {
			range = ""
			return
		}
		range = new Date(days.at(0) || "").toDateString() + " to " + new Date(days.at(-1) || "").toDateString()
	}

	let reviewToolUrls = $derived.by(() => {
		const hackatimeUserId = currentHackatimeAnalysis?.hackatimeUserId
		if (!hackatimeUserId) return null
		const days = Object.keys(currentHackatimeAnalysis?.dayMap ?? {})
		const start = days.at(0) ?? HACKATIME_REVIEW_START_DATE
		const end = days.at(-1) ?? new Date().toISOString().slice(0, 10)
		return {
			billy: buildBillyUrl(hackatimeUserId, start, end),
			joe: buildJoeFraudUrl(hackatimeUserId, start, end),
		}
	})
	const trustBadgeClass = (level: string | null | undefined): string => {
		const normalized = (level ?? "").toLowerCase()
		if (["green", "trusted", "high", "verified"].includes(normalized))
			return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
		if (["yellow", "suspected", "medium"].includes(normalized))
			return "bg-amber-500/10 text-amber-400 border-amber-500/20"
		if (["red", "convicted", "low", "banned"].includes(normalized))
			return "bg-rose-500/10 text-rose-400 border-rose-500/20"
		return "bg-zinc-800 text-zinc-400 border-zinc-700"
	}
	const copyToClipboard = async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text)
			toast.success(`${label} copied to clipboard`)
		} catch {
			toast.error("Failed to copy to clipboard")
		}
	}
	const loadStoredJustification = async () => {
		const response = await fetch("/admin/review2/justification", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ projectId: currentProject.id }),
		})
		if (!response.ok) {
			toast.info("No stored justification found for this project")
			return
		}
		const stored = await response.json()
		template = stored.justification
		justificationOpen = true
	}

	let changelogs = $state("")
	let projectDescription = $state("")
	let reasonForOverride = $state("")
	let gitCommits = 0
	let subtraction = 0
	let projectDescriptionLength = $derived(countCharacters(projectDescription))
	$effect(() => {
		if (currentProject.name) {
			generateFullJustification()
			fullTimeRange()
		}
	})
	$effect(() => {
		if (pending === true) {
			currentProject = {} as AdminProject
		} else {
			currentProject = {} as AdminProject
		}
	})

	type InDoubtResolution = "already_in_airtable" | "not_in_airtable"
	const pushToUnified = (
		projectId: string,
		justification: string,
		deductedHours: number,
		telescreenDecision: { reason: string; override?: string },
		resolveInDoubt?: InDoubtResolution
	) =>
		fetch("/admin/review2/sendToAirtable", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				projectId,
				justification,
				subtraction: deductedHours,
				resolveInDoubt,
				decisionReason: telescreenDecision.reason,
				telescreenOverride: telescreenDecision.override,
			}),
		})

	// An earlier push whose outcome is unknown (timeout, crash) must be resolved by a person: pushing again
	// blindly could create a second Unified record for the same hours
	const askHowToResolve = (message: string): InDoubtResolution | null => {
		if (
			confirm(
				`${message}\n\nOpen Airtable (YSWS Project Submission) and look for this project.\n\nPress OK if it IS already there: the award is recorded without submitting again.`
			)
		) {
			return "already_in_airtable"
		}
		if (confirm("Press OK if it is NOT in Airtable, to submit it again now. Press Cancel to do nothing.")) {
			return "not_in_airtable"
		}
		return null
	}

	const sendToDatabase = async () => {
		airtableProjects = airtableProjects.filter(p => p.id !== currentProject.id)
		const id = currentProject.id
		const name = currentProject.name
		const justification = template
		const deductedHours = subtraction
		const telescreenDecision = {
			reason: decisionReason,
			override: overrideActive ? overrideReason : undefined,
		}
		currentProject = {} as AdminProject
		let response = await pushToUnified(id, justification, deductedHours, telescreenDecision)

		if (response.status === 409) {
			const body = await response
				.clone()
				.json()
				.catch(() => null)
			if (body?.code === "SUBMISSION_IN_DOUBT") {
				const resolution = askHowToResolve(body.message)
				if (!resolution) {
					toast.info("Nothing was changed. Resolve it once you've checked Airtable.")
					loader = false
					invalidateAll()
					return
				}
				response = await pushToUnified(id, justification, deductedHours, telescreenDecision, resolution)
			}
		}

		if (response.ok) {
			toast.success("Pushed " + name + " to Airtable successfully!")
			loader = false
			invalidateAll()
			currentProject = {} as AdminProject
		} else {
			toast.error(await readErrorMessage(response, "Failed to push project to Airtable"))
			loader = false
			invalidateAll()
		}
	}
	const areAllPushedToHQ = (log: Log[]): boolean => {
		return log.every(entry => entry.submmitedToHQ || entry.status !== 1)
	}
	let pending = $state(true)
	let filteredProjects = $derived(
		airtableProjects?.filter(
			project =>
				wasEverApproved(project) && areAllPushedToHQ(JSON.parse(project.fields.log || "[]") as Log[]) !== pending
		) ?? []
	)

	let sentCount = $derived(
		airtableProjects?.filter(
			project => wasEverApproved(project) && areAllPushedToHQ(JSON.parse(project.fields.log || "[]") as Log[]) === true
		).length ?? 0
	)

	let pendingCount = $derived(
		airtableProjects?.filter(
			project => wasEverApproved(project) && areAllPushedToHQ(JSON.parse(project.fields.log || "[]") as Log[]) === false
		).length ?? 0
	)

	const rejectT2 = async () => {
		airtableProjects = airtableProjects.filter(p => p.id !== currentProject.id)

		const id = currentProject.id
		const slackId = currentProject.submittedBy
		currentProject = {} as AdminProject
		const response = await fetch("/admin/review2/reject", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				recordId: id,
				userExternal: projectDescription,
				justification: template,
				slackId,
				decisionReason,
			}),
		})

		if (response.ok && response.status !== 207) {
			toast.success("Rejected " + currentProject.name + " and sent notification to user!")
			loader = false
		} else if (response.status === 207) {
			toast.info("Project rejected but notification not sent")
			loader = false
		} else {
			toast.error(await readErrorMessage(response, "Failed to reject project"))
			loader = false
		}
	}

	let confirmPushOpen = $state(false)
	let confirmRejectOpen = $state(false)
</script>

<svelte:head>
	<title>Alchemize | T2 Review</title>
	<meta name="description" content="Alchemize T2 Review" />
	<meta property="og:title" content="Alchemize | T2 Review" />
</svelte:head>

<main class="flex h-screen w-screen gap-6 overflow-hidden p-6 font-sans text-primary">
	<div class="fixed inset-0 -z-10 bg-black/20"></div>
	<div class="relative z-50 flex h-full w-full items-start justify-start gap-x-5 p-5">
		<aside class="flex h-full w-1/4 flex-col overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900/50">
			<div class="border-b border-zinc-800 bg-zinc-900/20 p-4">
				<h3 class="text-sm font-semibold tracking-wider text-zinc-400 uppercase">T2 Review queue</h3>
			</div>
			{#if filteredProjects.length > 0}
				{#each filteredProjects as project (project.id)}
					<button
						onclick={() => setCurrentProject(project)}
						class="project h-20 w-full border-b p-2 hover:bg-background">
						<h1 class="flex h-10 w-full items-center px-2 text-xl font-bold">
							{project.fields.Name}
						</h1>
						<div class="flex h-6 items-end gap-4 px-2">
							<h2 class="creator text-sm text-gray-500">
								{project.fields.slackId}
							</h2>
							<div class="theme text-xs">{project.fields.Theme}</div>
							<span
								class={cn(
									"ml-auto rounded border px-1.5 py-0.5 text-[10px] font-medium",
									telescreenBadgeClass(project.telescreen)
								)}>
								{telescreenLabel(project.telescreen)}
							</span>
							{#if project.telescreen?.trustScore != null}
								<span
									title="Telescreen trust score"
									class={cn(
										"rounded border px-1.5 py-0.5 font-mono text-[10px]",
										trustBand(project.telescreen.trustScore)?.chip
									)}>
									{project.telescreen.trustScore}/10
								</span>
							{/if}
						</div>
					</button>
				{/each}
			{:else}
				<div class="flex flex-1 items-center justify-center p-4">
					<h2 class="text-center text-sm text-gray-500">
						{pending ? "No pending projects " : "No sent projects "}
					</h2>
				</div>
			{/if}
		</aside>
		<div class="flex h-full flex-1 flex-col gap-6 overflow-hidden">
			<nav
				class="flex w-full items-center justify-evenly gap-2 self-start rounded-xl border border-zinc-800 bg-zinc-900 p-1">
				<button
					class={cn(
						"flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
						pending ? "border border-amber-500/20 bg-amber-500/10 text-amber-400" : "text-zinc-400 hover:text-zinc-200"
					)}
					onclick={() => (pending = true)}>
					<span>Pending</span>
					<span
						class={cn(
							"rounded-md px-1.5 py-0.5 font-mono text-xs",
							pending ? "bg-amber-500/20 text-amber-300" : "bg-zinc-800 text-zinc-500"
						)}>
						{pendingCount}
					</span>
				</button>

				<button
					class={cn(
						"flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
						!pending
							? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
							: "text-zinc-400 hover:text-zinc-200"
					)}
					onclick={() => (pending = false)}>
					<span>Sent</span>
					<span
						class={cn(
							"rounded-md px-1.5 py-0.5 font-mono text-xs",
							!pending ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-800 text-zinc-500"
						)}>
						{sentCount}
					</span>
				</button>
			</nav>
			<div class="flex h-full flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30">
				{#if currentProject.name}
					<header
						class="flex w-full flex-shrink-0 flex-col items-start justify-between gap-3 border-b border-zinc-800 bg-zinc-950/20 px-5 py-4 sm:flex-row sm:items-center">
						<div class="space-y-0.5">
							<div class="flex flex-wrap items-center gap-x-2.5">
								<h1 class="text-lg font-bold tracking-tight text-zinc-100">
									{currentProject.name}
								</h1>
								<span
									class="rounded border border-zinc-700 bg-zinc-800/80 px-1.5 py-0.5 font-mono text-xs text-zinc-400">
									{currentProject.hours} hrs
								</span>
							</div>
							<p class="flex flex-wrap items-center gap-x-1.5 text-[11px] text-zinc-400">
								<span class="text-zinc-300">{currentProject.submittedBy}</span>
								<span class="text-zinc-700">•</span>
								<span>{currentProject.type}</span>
								<span class="text-zinc-700">•</span>
								<span>{currentProject.category}</span>
							</p>
							{#if currentHackatimeAnalysis?.hackatimeProject}
								<div class="flex flex-wrap items-center gap-1.5 pt-1">
									{#if currentHackatimeAnalysis?.hackatimeUserId}
										<button
											type="button"
											title="Copy Hackatime user ID"
											onclick={() => copyToClipboard(currentHackatimeAnalysis.hackatimeUserId ?? "", "Hackatime ID")}
											class="cursor-pointer rounded border border-zinc-700 bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[11px] text-zinc-300 transition hover:bg-zinc-700">
											Hackatime ID: {currentHackatimeAnalysis.hackatimeUserId} ⧉
										</button>
										<span
											class={cn(
												"rounded border px-1.5 py-0.5 text-[11px] font-medium",
												trustBadgeClass(currentHackatimeAnalysis?.trustFactor?.trustLevel)
											)}>
											Trust: {currentHackatimeAnalysis?.trustFactor?.trustLevel ?? "unknown"}{currentHackatimeAnalysis
												?.trustFactor?.trustValue != null
												? ` (${currentHackatimeAnalysis.trustFactor.trustValue})`
												: ""}
										</span>
									{:else}
										<span class="rounded border border-zinc-700 bg-zinc-800/80 px-1.5 py-0.5 text-[11px] text-zinc-500">
											No Hackatime user ID found
										</span>
									{/if}
								</div>
							{/if}
						</div>

						<div class="flex flex-shrink-0 items-center gap-1.5 self-end sm:self-auto">
							<Button
								onclick={() => (detailsOpen = true)}
								class="rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-[11px] text-zinc-300 transition hover:bg-zinc-700">
								Details
							</Button>
							<div class="mx-0.5 h-3 w-[1px] bg-zinc-800"></div>
							<a
								href={safeHref(currentProject.demo)}
								target="_blank"
								rel="noreferrer noopener"
								class="rounded-md bg-primary/20 px-2.5 py-1 text-[11px] font-medium text-primary transition hover:bg-primary/30"
								>Demo</a>
							<a
								href={safeHref(currentProject.code)}
								target="_blank"
								rel="noreferrer noopener"
								class="rounded-md bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition hover:bg-zinc-700"
								>Repo</a>
							<a
								href={`https://introspect.sahil.ink?${new URLSearchParams({
									repo_url: currentProject.code ?? "",
									demo_url: currentProject.demo ?? "",
									slack_id: currentProject.submittedBy ?? "",
									hours: String(currentProject.hours ?? ""),
									project_name: currentProject.name ?? "",
								})}`}
								target="_blank"
								rel="noreferrer noopener"
								class="rounded-md bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition hover:bg-zinc-700"
								>Introspect</a>
							{#if reviewToolUrls}
								<a
									href={reviewToolUrls.billy}
									target="_blank"
									rel="noreferrer noopener"
									class="rounded-md bg-indigo-500/20 px-2.5 py-1 text-[11px] font-medium text-indigo-300 transition hover:bg-indigo-500/30"
									>Billy ↗</a>
								<a
									href={reviewToolUrls.joe}
									target="_blank"
									rel="noreferrer noopener"
									class="rounded-md bg-indigo-500/20 px-2.5 py-1 text-[11px] font-medium text-indigo-300 transition hover:bg-indigo-500/30"
									>Joe.fraud ↗</a>
							{/if}
						</div>
					</header>

					<div class="grid min-h-0 grid-cols-1 grid-rows-2 overflow-hidden xl:grid-cols-[2fr_1fr] xl:grid-rows-1">
						<div class="custom-scrollbar flex h-full w-full flex-col items-center overflow-y-auto">
							<section class="w-full px-5 pt-5">
								<div class="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
									<div class="flex flex-wrap items-center justify-between gap-2">
										<div class="flex flex-wrap items-center gap-2">
											<h2 class="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">Telescreen</h2>
											<span
												class={cn(
													"rounded border px-1.5 py-0.5 text-[11px] font-medium",
													telescreenBadgeClass(currentTelescreen)
												)}>
												{telescreenLabel(currentTelescreen)}
											</span>
											{#if currentTelescreen?.trustScore != null}
												<span
													class={cn(
														"rounded border px-1.5 py-0.5 text-[11px] font-medium",
														trustBand(currentTelescreen.trustScore)?.chip
													)}>
													{trustBand(currentTelescreen.trustScore)?.label} · trust score {currentTelescreen.trustScore}/10
												</span>
											{/if}
										</div>
										<div class="flex items-center gap-1.5">
											<Button
												class="rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-[11px] text-zinc-300 transition hover:bg-zinc-700"
												onclick={() => telescreenAction("refresh")}
												disabled={telescreenBusy || !currentTelescreen}>
												Refresh
											</Button>
											{#if pending && telescreenNeedsSubmit(currentTelescreen)}
												<Button
													class="rounded-md bg-indigo-500/20 px-2.5 py-1 text-[11px] text-indigo-300 transition hover:bg-indigo-500/30"
													onclick={() => telescreenAction("submit")}
													disabled={telescreenBusy}>
													{currentTelescreen && !currentTelescreen.closed && currentTelescreen.robertProjectId
														? "Send again"
														: "Send to Telescreen"}
												</Button>
											{/if}
										</div>
									</div>
									{#if currentTelescreen && (currentTelescreen.reviewNote || currentTelescreen.trustScore != null)}
										<div
											class={cn(
												"space-y-1.5 rounded-lg border p-3",
												trustBand(currentTelescreen.trustScore)?.callout ?? "border-zinc-800 bg-zinc-900/40"
											)}>
											<div class="flex flex-wrap items-center justify-between gap-2">
												<strong class="text-[11px] tracking-wider text-zinc-300 uppercase">
													Fraud reviewer's note
													<span class="font-normal tracking-normal text-zinc-500 normal-case"
														>· internal, never shown to the participant</span>
												</strong>
												{#if currentTelescreen.reviewedAt}
													<span class="text-[11px] text-zinc-500"
														>Reviewed {formatTelescreenDate(currentTelescreen.reviewedAt)}</span>
												{/if}
											</div>
											<p class="text-sm wrap-break-word whitespace-pre-wrap text-zinc-100">
												{currentTelescreen.reviewNote || "The fraud reviewer left no note."}
											</p>
										</div>
									{/if}
									{#if currentTelescreen?.outcomeStatus}
										<p class="text-xs wrap-break-word text-zinc-400">
											Outcome: <span
												class={currentTelescreen.outcomeStatus === "approved" ? "text-emerald-400" : "text-rose-400"}
												>{currentTelescreen.outcomeStatus}</span>
											by {currentTelescreen.outcomeBy ?? "unknown"}{currentTelescreen.outcomeSource === "telescreen"
												? " in Telescreen"
												: ""}{currentTelescreen.outcomeReason &&
											currentTelescreen.outcomeReason !== currentTelescreen.reviewNote
												? `: ${currentTelescreen.outcomeReason}`
												: ""}
										</p>
									{/if}
									{#if currentTelescreen?.overrideBy}
										<p class="text-xs wrap-break-word text-rose-300">
											Approved without a Telescreen verdict by {currentTelescreen.overrideBy}: {currentTelescreen.overrideReason}
										</p>
									{/if}
									{#if telescreenPastReviews.length > 0}
										{@const rejectedBefore = telescreenPastReviews.some(review =>
											isTelescreenRejection(review.closeReason)
										)}
										<details class="rounded-lg border border-zinc-800 p-2" open={rejectedBefore}>
											<summary class="cursor-pointer text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
												Earlier Telescreen reviews ({telescreenPastReviews.length}){#if rejectedBefore}<span
														class="ml-1 tracking-normal text-rose-400 normal-case">· rejected by Telescreen before</span
													>{/if}
											</summary>
											<ul class="mt-2 space-y-2">
												<!-- eslint-disable-next-line svelte/require-each-key -- past reviews carry no id -->
												{#each telescreenPastReviews as review}
													<li class="space-y-1 rounded-lg border border-zinc-800/80 bg-zinc-900/20 p-2 text-xs">
														<div class="flex flex-wrap items-center gap-2">
															<span class="text-zinc-500"
																>{review.submittedAt
																	? `Sent ${formatTelescreenDate(review.submittedAt)}`
																	: "Never sent"}</span>
															{#if review.trustScore != null}
																<span
																	class={cn(
																		"rounded border px-1.5 py-0.5 text-[10px] font-medium",
																		trustBand(review.trustScore)?.chip
																	)}>{trustBand(review.trustScore)?.label} · {review.trustScore}/10</span>
															{/if}
															<span class="text-zinc-400"
																>{TELESCREEN_CLOSE_LABELS[review.closeReason ?? ""] ?? "Closed"}</span>
														</div>
														{#if review.reviewNote}
															<p class="wrap-break-word whitespace-pre-wrap text-zinc-200">
																<span class="text-zinc-500">Fraud reviewer:</span>
																{review.reviewNote}
															</p>
														{/if}
														{#if review.outcomeStatus}
															<p class="wrap-break-word text-zinc-400">
																Outcome: <span
																	class={review.outcomeStatus === "approved" ? "text-emerald-400" : "text-rose-400"}
																	>{review.outcomeStatus}</span>
																by {review.outcomeBy ?? "unknown"}{review.outcomeSource === "telescreen"
																	? " in Telescreen"
																	: ""}{review.outcomeReason && review.outcomeReason !== review.reviewNote
																	? `: ${review.outcomeReason}`
																	: ""}
															</p>
														{/if}
														{#if review.overrideBy}
															<p class="wrap-break-word text-rose-300">
																Approved without a Telescreen verdict by {review.overrideBy}: {review.overrideReason}
															</p>
														{/if}
													</li>
												{/each}
											</ul>
										</details>
									{/if}
									{#if pending && !telescreenGate.ok}
										<p class="text-xs text-amber-400">{telescreenGate.message}</p>
									{/if}
									{#if currentTelescreen?.lastError}
										<p class="text-xs wrap-break-word text-rose-400">
											Last Telescreen error: {currentTelescreen.lastError}
										</p>
									{/if}
									<p class="text-[10px] text-zinc-600">
										Telescreen credits the in-window Hackatime time on these projects once, when it first sees a
										submission, so on a later review cycle its hours won't match this review's delta.
									</p>
									{#if pending}
										<div class="space-y-1">
											<label
												for="decision-reason"
												class="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase"
												>Decision reason (sent to Telescreen)</label>
											<Textarea
												id="decision-reason"
												class="h-16 resize-none rounded-lg border-zinc-800 bg-zinc-950/40 p-2 text-xs focus:border-zinc-700"
												placeholder="Why you're approving or returning this project. Required to return it. Telescreen organizers see it, the participant doesn't."
												bind:value={decisionReason}
												maxlength={5000} />
										</div>
										{#if data.isSuperAdmin && !telescreenGate.ok && telescreenGate.overridable}
											<div class="space-y-1.5 rounded-lg border border-rose-900/40 p-2">
												<label class="flex items-center gap-2 text-xs text-rose-300">
													<input type="checkbox" bind:checked={overrideEnabled} />
													Approve without a Telescreen verdict (super admin, logged)
												</label>
												{#if overrideEnabled}
													<Textarea
														class="h-14 resize-none rounded-lg border-rose-900/30 bg-zinc-950/40 p-2 text-xs focus:border-rose-800"
														placeholder="Why this can't wait for Telescreen (at least 20 characters)"
														bind:value={overrideReason}
														maxlength={2000} />
												{/if}
											</div>
										{/if}
									{/if}
								</div>
							</section>
							<main
								class="grid grid-cols-1 content-start gap-5 border-b border-zinc-800 p-5 md:grid-cols-2 xl:col-span-2 xl:border-r xl:border-b-0">
								<div class="flex flex-col gap-y-3">
									<div class="flex h-50 max-h-50 flex-1 flex-col overflow-auto">
										<label
											for="project-desc"
											class="mb-1.5 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase"
											>Justification</label>
										<Textarea
											id="project-desc"
											class="h-full w-full flex-1 resize-none overflow-auto rounded-xl border-zinc-800 bg-zinc-950/40 p-3 text-sm focus:border-zinc-700"
											placeholder="Describe in detail, everything technical. What the project does, how many commits, any hours deducted, why deduction of hours, how is the readme, any AI time logged, etc."
											bind:value={projectDescription}
											oninput={() => generateFullJustification()} />
									</div>

									<div
										class="flex w-full items-center gap-2 rounded-lg border bg-zinc-950/10 px-3 py-2 text-[10px] transition-all duration-200
									{projectDescriptionLength > 250
											? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
											: 'border-amber-500/20 bg-amber-500/5 text-amber-400'}">
										<Info class="h-3.5 w-3.5" />
										<span>
											{projectDescriptionLength > 250
												? "Justification character target met."
												: `Requires 20+ characters for rejection and 250+ for approval (${projectDescriptionLength}/250)`}
										</span>
									</div>
								</div>

								<div class="flex w-full flex-col justify-between space-y-4">
									<div class="grid w-full grid-rows-2 gap-y-3">
										<div class="grid w-full grid-cols-2 gap-3">
											<div class="space-y-1.5 rounded-xl border border-zinc-800/60 bg-zinc-950/10 p-3">
												<label for="git-commits" class="text-[11px] font-medium text-zinc-400">Git Commits</label>
												<Input
													id="git-commits"
													type="number"
													class="h-8 w-full rounded-md border-zinc-800 bg-zinc-950/60 text-sm"
													placeholder="0"
													bind:value={gitCommits}
													oninput={() => generateFullJustification()} />
											</div>

											<div class="space-y-1.5 rounded-xl border border-zinc-800/60 bg-zinc-950/10 p-3">
												<label
													for="override-hours"
													class="flex items-center justify-between text-[11px] font-medium text-zinc-400">
													<span>Deduct Hours</span>
													<span class="text-[9px] font-normal text-zinc-600">Optional</span>
												</label>
												<Input
													id="override-hours"
													type="number"
													min="0"
													class="h-8 w-full rounded-md border-zinc-800 bg-zinc-950/60 text-sm"
													placeholder="0"
													bind:value={subtraction}
													oninput={() => generateFullJustification()} />
											</div>
										</div>
										<div class="space-y-1.5 rounded-xl border border-zinc-800/60 bg-zinc-950/10 p-3">
											<label
												for="time-range"
												class="flex items-center justify-between text-[11px] font-medium text-zinc-400">
												<span>Hackatime Time-range</span>
												<span class="text-[9px] font-normal text-zinc-600">Time-range</span>
											</label>
											<Input
												id="time-range"
												min="0"
												class="h-8 w-full rounded-md border-zinc-800 bg-zinc-950/60 text-xs"
												placeholder="Date Range"
												value={range}
												readonly />
										</div>
									</div>

									<div class="flex flex-1 flex-col justify-end space-y-3">
										<div class="space-y-1">
											<label
												id="changelogs-label"
												class="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">Changelog Notes</label>
											<Textarea
												aria-labelledby="changelogs-label"
												class="h-16 resize-none rounded-lg border-zinc-800 bg-zinc-950/40 p-2 text-xs focus:border-zinc-700"
												placeholder="What distinct changes were made?..."
												bind:value={changelogs}
												oninput={() => generateFullJustification()}
												disabled={currentProject.update || currentProject.log.length > 1} />
										</div>

										{#if subtraction > 0}
											<div class="space-y-1">
												<label
													id="override-label"
													class="text-[11px] font-semibold tracking-wider text-amber-500 uppercase"
													>Deduction Justification</label>
												<Textarea
													aria-labelledby="override-label"
													class="h-16 resize-none rounded-lg border-amber-900/30 bg-zinc-950/40 p-2 text-xs focus:border-amber-800"
													placeholder="Provide context regarding modifications..."
													bind:value={reasonForOverride}
													oninput={() => generateFullJustification()} />
											</div>
										{/if}
									</div>
								</div>
							</main>
							{#if currentHackatimeAnalysis.aiSec !== undefined}
								{@const totalTime = Math.max(
									currentHackatimeAnalysis.aiSec +
										currentHackatimeAnalysis.buildingSec +
										currentHackatimeAnalysis.others +
										currentHackatimeAnalysis.codingSec +
										currentHackatimeAnalysis.timelapsingSec,
									1
								)}
								<div
									class="ht-data border-neutral-800rounded-xl flex h-auto w-9/10 flex-col items-center border-2 py-20 pt-4">
									<header>
										Hackatime Project: {currentHackatimeAnalysis.hackatimeProject}
										({Math.round(totalTime / 360) / 10}h)
									</header>
									<div class="ai h-6 w-9/10">
										<div class="bar flex h-full w-full">
											<div
												class="flex h-full items-center justify-center overflow-hidden bg-primary text-xs text-zinc-200"
												style={`width: ${(currentHackatimeAnalysis.codingSec / totalTime) * 100}%`}>
												Normal Coding Time: {Math.round(currentHackatimeAnalysis.codingSec / 360) / 10}h/{Math.round(
													totalTime / 360
												) / 10}h
											</div>
											<div
												class="flex h-full items-center justify-center overflow-hidden bg-[#DE7356] text-xs text-zinc-200"
												style={`width: ${(currentHackatimeAnalysis.aiSec / totalTime) * 100}%`}>
												AI Time: {Math.round(currentHackatimeAnalysis.aiSec / 360) / 10}h/{Math.round(totalTime / 360) /
													10}h
											</div>
											<div
												class="flex h-full items-center justify-center overflow-hidden bg-[#F5A623] text-xs text-zinc-200"
												style={`width: ${(currentHackatimeAnalysis.buildingSec / totalTime) * 100}%`}>
												Building Time: {Math.round(currentHackatimeAnalysis.buildingSec / 360) / 10}h/{Math.round(
													totalTime / 360
												) / 10}h
											</div>
											<div
												class="flex h-full items-center justify-center overflow-hidden bg-[#BF0B0B] text-xs text-zinc-200"
												style={`width: ${(currentHackatimeAnalysis.timelapsingSec / totalTime) * 100}%`}>
												Timelapsing Time: {Math.round(currentHackatimeAnalysis.timelapsingSec / 360) / 10}h/{Math.round(
													totalTime / 360
												) / 10}h
											</div>
											<div
												class="flex h-full items-center justify-center overflow-hidden bg-gray-500 text-xs text-zinc-200"
												style={`width: ${(currentHackatimeAnalysis.others / totalTime) * 100}%`}>
											</div>
										</div>
									</div>
									<div class="day-summary-chart w-9/10">
										<canvas bind:this={daySummaryChart} class="w-full"></canvas>
									</div>
								</div>
							{/if}
						</div>

						<aside
							class="flex h-full min-h-100 flex-col overflow-hidden border-t border-zinc-800 bg-zinc-950/10 xl:col-span-1 xl:border-t-0">
							<div
								class="flex flex-shrink-0 items-center justify-between border-b border-zinc-800/60 bg-zinc-950/20 px-4 py-3">
								<h2 class="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">Previous Logs</h2>
								<span class="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[9px] text-zinc-400"
									>{currentProject.log.length}</span>
							</div>

							<div
								class="custom-scrollbar space-y-3 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 wrap-break-word">
								{#if currentProject.log && currentProject.log.length > 0}
									<!-- eslint-disable-next-line svelte/require-each-key -- log entries and their messages have no id -->
									{#each [...currentProject.log].reverse() as entry}
										<!-- eslint-disable-next-line svelte/require-each-key -- log entries and their messages have no id -->
										{#each [...entry.message].reverse() as msg, i}
											<div
												class="border {msg.reviewerName === 'user'
													? 'border-l-amber-500'
													: i === 0 || msg.reviewerName?.includes('APPROVED')
														? entry.status === 1 || msg.reviewerName?.includes('APPROVED')
															? 'border-l-emerald-500'
															: 'border-l-rose-500'
														: 'border-l-rose-500'} space-y-2 rounded-lg border-zinc-800/80 bg-zinc-900/20 p-3 text-xs">
												<div
													class="flex items-center justify-between border-b border-zinc-900 pb-1.5 text-[11px] text-zinc-500">
													<span class="font-bold text-zinc-400"
														>Reviewer: <span class="font-mono text-indigo-400">@{msg.reviewerName || "staff"}</span
														></span>
													<span>{new Date(msg.timestamp).toLocaleString()}</span>
												</div>
												{#if msg.userExternal}
													<p class="leading-relaxed text-zinc-300">
														<strong class="mb-0.5 block text-[10px] tracking-wider text-zinc-500 uppercase"
															>Feedback Note:</strong>
														{msg.userExternal}
													</p>
												{/if}
												{#if msg.internalNote}
													<p class="rounded border border-zinc-900/20 bg-zinc-900/30 p-2 text-zinc-500 italic">
														<strong class="mb-0.5 block text-[10px] tracking-wider text-zinc-600 uppercase not-italic"
															>Internal Note:</strong>
														{msg.internalNote}
													</p>
												{/if}
											</div>
										{/each}
									{/each}
								{:else}
									<p class="py-4 text-center text-xs text-zinc-600 italic">No cert history</p>
								{/if}
							</div>
						</aside>
					</div>

					<footer
						class="flex w-full flex-shrink-0 flex-col items-center justify-end gap-2.5 border-t border-zinc-800 bg-zinc-950/40 px-5 py-3.5 sm:flex-row">
						{#if pending}
							<Button
								class="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700 sm:w-auto"
								onclick={() => {
									generateFullJustification()
									justificationOpen = true
								}}>
								Preview Justification
							</Button>
							<Button
								class="w-full rounded-lg border border-rose-700 bg-rose-600 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:bg-rose-400 sm:w-auto"
								onclick={() => (confirmRejectOpen = true)}
								disabled={projectDescriptionLength < 20 || loader || decisionReason.trim() === ""}
								title={decisionReason.trim() === "" ? "Write a decision reason for Telescreen first" : undefined}>
								Return
							</Button>
							<Button
								class="flex w-full items-center justify-center gap-x-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-medium text-primary-foreground transition hover:bg-emerald-500 sm:w-auto"
								onclick={() => (confirmPushOpen = true)}
								disabled={projectDescriptionLength < 250 || loader || !canPush}
								title={!canPush ? telescreenGate.message : undefined}>
								{#if loader}
									<div class="h-3 w-3 animate-spin rounded-full border-2 border-emerald-200 border-t-white"></div>
								{/if}
								Push to Airtable
							</Button>
						{:else}
							<Button
								class="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700 sm:w-auto"
								onclick={loadStoredJustification}>
								Stored Justification
							</Button>
							<Button
								class="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700 sm:w-auto"
								onclick={() => {
									generateFullJustification({ includePushed: true })
									justificationOpen = true
								}}>
								Regenerate Justification
							</Button>
						{/if}
					</footer>
				{:else}
					<div class="flex h-full w-full flex-col items-center justify-center gap-2 text-zinc-600">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="48"
							height="48"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="lucide lucide-folder-open text-zinc-700"
							><path
								d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" /></svg>
						<p class="text-xl font-medium tracking-tight">Select a project from the left queue to review</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</main>

<ProjectDetailsDialog bind:open={detailsOpen} project={currentProject} />
{#if justificationOpen}
	<Dialog.Root bind:open={justificationOpen}>
		<Dialog.Content class="flex h-[50vh] min-w-[40vw] flex-col border-zinc-800 bg-zinc-950 p-4 text-zinc-100">
			<Dialog.Header class="shrink-0">
				<Dialog.Title class="text-xl font-bold text-zinc-100">Generated Justification</Dialog.Title>
				<Dialog.Description class="text-xs text-zinc-400">Review the auto-generated justification.</Dialog.Description>
			</Dialog.Header>

			<div class="my-4 flex min-h-0 flex-1 flex-col">
				<Textarea
					class="custom-scrollbar h-full w-full resize-none overflow-y-auto rounded-lg border-zinc-800 bg-zinc-900/50 p-3 font-mono text-xs text-zinc-300"
					bind:value={template} />
			</div>
			<div class="flex shrink-0 justify-end gap-2">
				{#if !pending}
					<Button
						class="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700"
						onclick={() => generateFullJustification({ includePushed: true })}>
						Regenerate
					</Button>
				{/if}
				<Button
					class="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-primary-foreground transition hover:bg-emerald-500"
					onclick={() => copyToClipboard(template, "Justification")}>
					Copy to clipboard
				</Button>
			</div>
		</Dialog.Content>
	</Dialog.Root>
{/if}
{#if confirmRejectOpen}
	<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80">
		<div class="flex w-96 flex-col gap-y-4 rounded-xl border border-zinc-800 bg-zinc-950 p-6">
			<h2 class="text-lg font-bold text-rose-500">Confirm Rejection</h2>
			<p class="text-sm text-zinc-400">
				Are you sure you want to return <strong>{currentProject.name}</strong>? This will notify the user.
			</p>
			<div class="flex justify-end gap-2">
				<Button onclick={() => (confirmRejectOpen = false)} class="bg-zinc-800 text-xs text-zinc-300 hover:bg-zinc-700">
					Cancel
				</Button>
				<Button
					onclick={async () => {
						confirmRejectOpen = false
						await rejectT2()
					}}
					class="bg-rose-600 text-xs text-primary-foreground hover:bg-rose-500">
					Yes, Return
				</Button>
			</div>
		</div>
	</div>
{/if}

{#if confirmPushOpen}
	<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80">
		<div class="flex w-96 flex-col gap-y-4 rounded-xl border border-zinc-800 bg-zinc-950 p-6">
			<h2 class="text-lg font-bold text-emerald-500">Confirm Push</h2>
			<p class="text-sm text-zinc-400">
				Are you ready to submit <strong>{currentProject.name}</strong> to Airtable? This action is final.
			</p>
			<div class="flex justify-end gap-2">
				<Button onclick={() => (confirmPushOpen = false)} class="bg-zinc-800 text-xs text-zinc-300 hover:bg-zinc-700">
					Cancel
				</Button>
				<Button
					onclick={async () => {
						confirmPushOpen = false
						await sendToDatabase()
					}}
					class="bg-emerald-600 text-xs text-primary-foreground hover:bg-emerald-500">
					Yes, Push
				</Button>
			</div>
		</div>
	</div>
{/if}
