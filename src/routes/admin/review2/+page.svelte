<script lang="ts">
	import ProjectDetailsDialog from "$lib/components/projectdetails-dialog.svelte"
	import Button from "$lib/components/ui/button/button.svelte"
	import Input from "$lib/components/ui/input/input.svelte"
	import Textarea from "$lib/components/ui/textarea/textarea.svelte"
	import type { Project, Log, AirtableProject, HackatimeAnalysis } from "$lib/types"
	import { toast } from "svelte-sonner"
	import { invalidateAll } from "$app/navigation"
	import { countCharacters } from "$lib/utils"
	import { cn } from "$lib/lib/utils"
	import { tick } from "svelte"
	import {BarController, BarElement, CategoryScale, Chart, Legend, LinearScale, Title, Tooltip} from "chart.js";
	interface AdminProjectAccess extends AirtableProject {
		fields: AirtableProject["fields"] & {
			unifiedId: string
		}
	}
	interface AdminProject extends Project {
		unifiedId: string
	}
	let detailsOpen = $state(false)
	let currentHackatimeAnalysis = $state({} as HackatimeAnalysis)
	let { data } = $props()
	let airtableProjects = $derived(data.projects as AdminProjectAccess[])
	let project = $state({} as Project)
	let justificationOpen = $state(false)
	let daySummaryChart = $state<HTMLCanvasElement | undefined>(undefined)
	let daySummaryChartInstance: Chart<"bar"> | null = null
	Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title)
	const wasEverApproved = (project: AirtableProject) => {
		//Checks the logs and returns true if there was ever an approved log, that is not sent to airtable (aka not pushed)
		console.log("Checking if project was ever approved:", project.fields.Name)
		const logs = JSON.parse(project.fields.log || "[]") as Log[]
		console.log("Checking if project was ever approved:", project.fields.Name)
		return logs.some(log => log.status === 1)
	}
	let currentProject = $state({} as AdminProject)
	function calculateRecordedTime(log: Log[]): number {
		let totalTime = 0
		for (const entry of log) {
			totalTime += entry.deltaTime
		}
		return totalTime
	}
		const renderBar = () => {
		if (!daySummaryChart || !currentHackatimeAnalysis?.dayMap) {
			return
		}
		let dataLabels = []
		let dataValues = []
		for (const [key, value] of Object.entries(currentHackatimeAnalysis.dayMap)) {
			dataLabels.push(key)
			dataValues.push(Math.round((value / 3600) * 10) / 10)
		}
		const configs = {
			  type: 'bar',
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
			type: 'bar',
			data: configs.data,
			options: {
				indexAxis: 'y',
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
	

		const response = await fetch(`/admin/review2/analyzeHackatime`,{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				projectId: projectId,
			}),

		})
		const data = await response.json()
		console.log("Hackatime analysis data:", data)
		currentHackatimeAnalysis = data
		await tick()
		renderBar()
	}

	const setCurrentProject = (nextProject: AdminProjectAccess) => {
		currentProject = {
			id: nextProject.id,
			name: nextProject.fields.Name,
			hours: Math.floor(
				calculateRecordedTime(
					JSON.parse(nextProject.fields.log ?? "[]") as Log[]
				)*10 / 60
			)/10,
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
			owner: nextProject.fields.owner,
			screenshot2: nextProject.fields.screenshot2,
			screenshot: nextProject.fields.screenshot,
			unifiedId: nextProject.fields.unifiedId,
		}
					currentHackatimeAnalysis = {} as HackatimeAnalysis
			fetchHackatimeAnalysis(currentProject.id + "")
		console.log("Current project set to log:", currentProject.log)
	}
	const calculateDelta = (log: Log[]): number => {
		let delta = 0
		for (const entry of log) {
			if (entry.status === 1 && !entry.submmitedToHQ) {
				delta += entry.deltaTime
			}
		}
		return Math.floor(delta / 60)
	}
	const generateUserLogs = (log: Log[]): string => {
		let logs = ""
		for (const entry of log) {
			if (entry.status === 1 && !entry.submmitedToHQ) {
				let approvedBy = "T1 Reviewer: " + entry.message.at(-1)?.reviewerName
				let userLogs = ``
				for (const message of entry.message) {
					if (message.reviewerName === "user") {
						userLogs += `User written logs: ${message.userExternal} \n`
					} else {
						userLogs += `Reviewer notes: ${message.userExternal} \n`
					}
				}
				let deltaTime = `Delta: ${Math.floor(entry.deltaTime / 60)} hours \n`
				let finalFeedback = `Approval Feedback: ${entry.message.at(-1)?.userExternal || "No feedback provided"} \n`
				let finalEnry = `${userLogs}${deltaTime}\n${finalFeedback} \nApproved by: ${approvedBy} \n\n`
				logs += finalEnry
			}
		}
		return logs
	}
	let template = $state("")
	let loader = $state(false)
	const generateFullJustification = () => {
		template = `The user tracked ${currentProject.hours} hours on ${currentProject.hackatime} hackatime project
${currentProject.update || currentProject.log.length > 1 ? `This project is an update to an existing project` : `This is the first submission of this project`}
Delta:${calculateDelta(currentProject.log)} hours, Adjusted to:${calculateDelta(currentProject.log) - subtraction} Subtract ${subtraction} hours \n
${projectDescription}
${currentProject.update || currentProject.log.length > 1 ? `Changelog: ${changelogs}` : ``}
There are ${gitCommits} git commits and approximately ${gitCommits > 0 ? Math.floor((gitCommits / currentProject.hours) * 10) / 10 : 0} commits/hr
${subtraction > 0 ? `The reason for overriding hours is: ${reasonForOverride}` : ``}
User written logs:
${generateUserLogs(currentProject.log)}
Signed by ${data.name}, T2 Reviewer
 `
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

		}
	})
	$effect(() => {
		if (pending === true) {
			currentProject = {} as AdminProject
		} else {
			currentProject = {} as AdminProject
		}

	})

	const sendToDatabase = async () => {
		airtableProjects = airtableProjects.filter(p => p.id !== currentProject.id)
		const id = currentProject.id
		currentProject = {} as AdminProject
		const response = await fetch("/admin/review2/sendToAirtable", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				projectId: id,
				justification: template,
				subtraction,
			}),
		})

		if (response.ok) {
			toast.success(
				"Pushed " + currentProject.name + " to Airtable successfully!"
			)
			loader = false
			invalidateAll()
			currentProject = {} as AdminProject
		} else {
			toast.error(
				(await response.text()) || "Failed to push project to Airtable"
			)
			loader = false
		}
	}
	const areAllPushedToHQ = (log: Log[]): boolean => {
		return log.every(entry => entry.submmitedToHQ || entry.status !== 1)
	}
	let pending = $state(true)
	let filteredProjects = $derived(
		airtableProjects?.filter(
			project =>
				wasEverApproved(project) &&
				areAllPushedToHQ(JSON.parse(project.fields.log || "[]") as Log[]) !==
					pending
		) ?? []
	)

	airtableProjects?.forEach(project => {
		console.log(
			"Filtered project: ",
			project.fields.Name,
			" | Was ever approved: ",
			wasEverApproved(project),
			" | All pushed to HQ: ",
			areAllPushedToHQ(JSON.parse(project.fields.log || "[]") as Log[]),
			" | Pending: ",
			pending
		)
	})
	const rejectT2 = async () => {
		airtableProjects = airtableProjects.filter(p => p.id !== currentProject.id)

		const id = currentProject.id
		const slackId = currentProject.submittedBy
		currentProject = {} as AdminProject
		const response = await fetch("/admin/review2/reject", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				recordId: id,
				userExternal: projectDescription,
				justification: template,
				slackId: slackId,
			}),
		})

		if (response.ok && response.status !== 207) {
			toast.success(
				"Rejected " + currentProject.name + " and sent notification to user!"
			)
			loader = false
		} else if (response.status === 207) {
			toast.info("Project rejected but notification not sent")
			loader = false
		} else {
			toast.error((await response.text()) || "Failed to reject project")
			loader = false
		}
	}
</script>

<svelte:head>
	<title>Alchemize | T2 Review</title>
	<meta name="description" content="Alchemize T2 Review" />
	<meta property="og:title" content="Alchemize | T2 Review" />
</svelte:head>

<main
	class="w-screen h-screen text-admin-text font-sans overflow-hidden p-6 flex gap-6"
>
	<div class="fixed inset-0 bg-black/20 -z-10"></div>
	<div
		class="relative z-50 p-5 h-full w-full flex items-start justify-start gap-x-5"
	>
		<aside
			class="w-1/4 h-full rounded-2xl bg-zinc-900/50 border border-zinc-800 flex flex-col overflow-hidden"
		>
			<div class="p-4 border-b border-zinc-800 bg-zinc-900/20">
				<h3
					class="font-semibold text-zinc-400 text-sm tracking-wider uppercase"
				>
					T2 Review queue
				</h3>
			</div>
			{#if filteredProjects.length > 0}
				{#each filteredProjects as project}
					<button
						onclick={() => setCurrentProject(project)}
						class="project w-full border-b h-20 p-2 hover:bg-background"
					>
						<h1 class="text-xl font-bold w-full flex items-center h-10 px-2">
							{project.fields.Name}
						</h1>
						<div class="flex px-2 gap-4 items-end h-6">
							<h2 class="creator text-sm text-gray-500">
								{project.fields.slackId}
							</h2>
							<div class="theme text-xs">{project.fields.Theme}</div>
						</div>
					</button>
				{/each}
			{:else}
				<div class="flex-1 flex items-center justify-center p-4">
					<h2 class="text-sm text-gray-500 text-center">
						{pending ? "No pending projects " : "No sent projects "}
					</h2>
				</div>
			{/if}
		</aside>
		<div class="flex-1 h-full flex flex-col gap-6 overflow-hidden">
			<nav
				class="w-full flex items-center justify-evenly gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-xl self-start"
			>
				<button
					class={cn(
						"px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2",
						pending
							? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
							: "text-zinc-400 hover:text-zinc-200"
					)}
					onclick={() => (pending = true)}
				>
					Pending
				</button>

				<button
					class={cn(
						"px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2",
						!pending
							? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
							: "text-zinc-400 hover:text-zinc-200"
					)}
					onclick={() => (pending = false)}
				>
					Sent
				</button>
			</nav>
			<div
				class="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden h-full"
			>
				{#if currentProject.name}
					<header
						class="w-full px-5 py-4 border-b border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-950/20 flex-shrink-0"
					>
						<div class="space-y-0.5">
							<div class="flex items-center gap-x-2.5 flex-wrap">
								<h1 class="text-lg text-zinc-100 font-bold tracking-tight">
									{currentProject.name}
								</h1>
								<span
									class="text-xs px-1.5 py-0.5 bg-zinc-800/80 text-zinc-400 rounded font-mono border border-zinc-700"
								>
									{currentProject.hours} hrs
								</span>
							</div>
							<p
								class="text-[11px] text-zinc-400 flex flex-wrap items-center gap-x-1.5"
							>
								<span class="text-zinc-300">{currentProject.submittedBy}</span>
								<span class="text-zinc-700">•</span>
								<span>{currentProject.type}</span>
								<span class="text-zinc-700">•</span>
								<span>{currentProject.category}</span>
							</p>
						</div>

						<div
							class="flex items-center gap-1.5 self-end sm:self-auto flex-shrink-0"
						>
							<Button
								onclick={() => (detailsOpen = true)}
								class="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[11px] px-2.5 py-1 rounded-md text-zinc-300 transition"
							>
								Details
							</Button>
							<div class="h-3 w-[1px] bg-zinc-800 mx-0.5"></div>
							<a
								href={currentProject.demo}
								target="_blank"
								rel="noreferrer noopener"
								class="text-[11px] font-medium px-2.5 py-1 bg-admin-primary/20 hover:bg-admin-primary/30 text-admin-text rounded-md transition"
								>Demo</a
							>
							<a
								href={currentProject.code}
								target="_blank"
								rel="noreferrer noopener"
								class="text-[11px] font-medium px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition"
								>Repo</a
							>
							<a
								href="https://introspect.sahil.ink?repo_url={currentProject.code}&demo_url={currentProject.demo}&slack_id={currentProject.submittedBy}&hours={currentProject.hours}&project_name={currentProject.name}"
								target="_blank"
								rel="noreferrer noopener"
								class="text-[11px] font-medium px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition"
								>Introspect</a
							>
						</div>
					</header>

					<div
						class="overflow-hidden grid grid-cols-1 xl:grid-cols-[2fr_1fr] grid-rows-2 xl:grid-rows-1 min-h-0"
					>
						<div class="w-full h-full flex flex-col items-center overflow-y-auto custom-scrollbar">
							<main
								class="xl:col-span-2 p-5 grid grid-cols-1 md:grid-cols-2 gap-5 content-start border-b xl:border-b-0 xl:border-r border-zinc-800 "
							>
								<div class="flex flex-col gap-y-3">
									<div class="flex flex-col flex-1 min-h-[160px]">
										<label
											for="project-desc"
											class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5"
											>Project Summary</label
										>
										<Textarea
											id="project-desc"
											class="resize-none flex-1 w-full bg-zinc-950/40 border-zinc-800 focus:border-zinc-700 rounded-xl text-sm p-3 min-h-[120px]"
											placeholder="Briefly describe the project..."
											bind:value={projectDescription}
											oninput={generateFullJustification}
										/>
									</div>

									<div
										class="w-full min-h-8 gap-2 rounded-lg flex items-center px-3 text-[11px] border transition-all duration-200 bg-zinc-950/10
									{projectDescriptionLength > 20
											? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5'
											: 'text-amber-400 border-amber-500/20 bg-amber-500/5'}"
									>
										<i class="fa-solid fa-circle-info"></i>
										<span>
											{projectDescriptionLength > 20
												? "Description character target met."
												: `Requires 20+ characters (${projectDescriptionLength}/20)`}
										</span>
									</div>
								</div>

								<div class="w-full space-y-4 flex flex-col justify-between">
									<div class="w-full grid grid-rows-2 gap-3">
										<div
											class="bg-zinc-950/10 border border-zinc-800/60 p-3 rounded-xl space-y-1.5"
										>
											<label
												for="git-commits"
												class="text-[11px] font-medium text-zinc-400"
												>Git Commits</label
											>
											<Input
												id="git-commits"
												type="number"
												class="h-8 w-full bg-zinc-950/60 border-zinc-800 text-sm rounded-md"
												placeholder="0"
												bind:value={gitCommits}
												oninput={generateFullJustification}
											/>
										</div>

										<div
											class="bg-zinc-950/10 border border-zinc-800/60 p-3 rounded-xl space-y-1.5"
										>
											<label
												for="override-hours"
												class="text-[11px] font-medium text-zinc-400 flex items-center justify-between"
											>
												<span>Deduct Hours</span>
												<span class="text-[9px] text-zinc-600 font-normal"
													>Optional</span
												>
											</label>
											<Input
												id="override-hours"
												type="number"
												min="0"
												class="h-8 w-full bg-zinc-950/60 border-zinc-800 text-sm rounded-md"
												placeholder="0"
												bind:value={subtraction}
												oninput={generateFullJustification}
											/>
										</div>
									</div>

									<div class="space-y-3 flex-1 flex flex-col justify-end">
										<div class="space-y-1">
											<label
												id="changelogs-label"
												class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider"
												>Changelog Notes</label
											>
											<Textarea
												aria-labelledby="changelogs-label"
												class="resize-none h-16 bg-zinc-950/40 border-zinc-800 focus:border-zinc-700 text-xs rounded-lg p-2"
												placeholder="What distinct changes were made?..."
												bind:value={changelogs}
												oninput={generateFullJustification}
												disabled={currentProject.update ||
													currentProject.log.length > 1}
											/>
										</div>

										{#if subtraction > 0}
											<div class="space-y-1">
												<label
													id="override-label"
													class="text-[11px] font-semibold text-amber-500 uppercase tracking-wider"
													>Deduction Justification</label
												>
												<Textarea
													aria-labelledby="override-label"
													class="resize-none h-16 bg-zinc-950/40 border-amber-900/30 focus:border-amber-800 text-xs rounded-lg p-2"
													placeholder="Provide context regarding modifications..."
													bind:value={reasonForOverride}
													oninput={generateFullJustification}
												/>
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
								<div class="ht-data w-9/10 h-auto py-20 border-2 border-neutral-800rounded-xl flex flex-col items-center pt-4">
									<header>Hackatime Project: {currentHackatimeAnalysis.hackatimeProject} ({Math.round(totalTime/360)/10}h)</header>
									<div class="ai h-6 w-9/10">
										<div class="bar h-full w-full flex">
											<div
												class="h-full bg-admin-primary flex items-center justify-center text-xl text-zinc-200"
												style={`width: ${currentHackatimeAnalysis.codingSec / totalTime * 100}%`}
											></div>
											<div
												class="h-full bg-[#DE7356] flex items-center justify-center text-xl text-zinc-200"
												style={`width: ${currentHackatimeAnalysis.aiSec / totalTime * 100}%`}
											></div>
											<div
												class="h-full bg-[#F5A623] flex items-center justify-center text-xl text-zinc-200"
												style={`width: ${currentHackatimeAnalysis.buildingSec / totalTime * 100}%`}
											></div>
											<div
												class="h-full bg-[#BF0B0B] flex items-center justify-center text-xl text-zinc-200"
												style={`width: ${currentHackatimeAnalysis.timelapsingSec / totalTime * 100}%`}
											></div>
											<div
												class="h-full bg-gray-500 flex items-center justify-center text-xl text-zinc-200"
												style={`width: ${currentHackatimeAnalysis.others / totalTime * 100}%`}
											></div>
										</div>
									</div>
									<div class="day-summary-chart w-9/10">
									
										<canvas bind:this={daySummaryChart} class="w-full"></canvas>
									</div>
								</div>
							{/if}
						</div>

						<aside
							class="xl:col-span-1 min-h-100  bg-zinc-950/10 flex flex-col overflow-hidden h-full border-t xl:border-t-0 border-zinc-800"
						>
							<div
								class="px-4 py-3 border-b border-zinc-800/60 bg-zinc-950/20 flex items-center justify-between flex-shrink-0"
							>
								<h2
									class="text-[11px] font-semibold text-zinc-400 tracking-wider uppercase"
								>
									Previous Changelogs
								</h2>
								<span
									class="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono"
									>{currentProject.log.length} Logs</span
								>
							</div>

							<div
								class="border border-zinc-800 bg-zinc-950/40 rounded-xl p-4 overflow-y-auto wrap-break-word space-y-3 custom-scrollbar"
							>
								{#if currentProject.log && currentProject.log.length > 0}
									{#each [...currentProject.log].reverse() as entry}
										{#each [...entry.message].reverse() as msg, i}
											<div
												class="border {msg.reviewerName === 'user'
													? 'border-l-amber-500'
													: i === 0 || msg.reviewerName?.includes('APPROVED')
														? entry.status === 1 ||
															msg.reviewerName?.includes('APPROVED')
															? 'border-l-emerald-500'
															: 'border-l-rose-500'
														: 'border-l-rose-500'} border-zinc-800/80 bg-zinc-900/20 p-3 rounded-lg space-y-2 text-xs"
											>
												<div
													class="flex items-center justify-between border-b border-zinc-900 pb-1.5 text-[11px] text-zinc-500"
												>
													<span class="font-bold text-zinc-400"
														>Reviewer: <span class="text-indigo-400 font-mono"
															>@{msg.reviewerName || "staff"}</span
														></span
													>
													<span>{new Date(msg.timestamp).toLocaleString()}</span
													>
												</div>
												{#if msg.userExternal}
													<p class="text-zinc-300 leading-relaxed">
														<strong
															class="text-[10px] uppercase tracking-wider text-zinc-500 block mb-0.5"
															>Feedback Note:</strong
														>
														{msg.userExternal}
													</p>
												{/if}
												{#if msg.internalNote}
													<p
														class="text-zinc-500 italic bg-zinc-900/30 p-2 rounded border border-zinc-900/20"
													>
														<strong
															class="text-[10px] uppercase tracking-wider text-zinc-600 block not-italic mb-0.5"
															>Internal Note:</strong
														>
														{msg.internalNote}
													</p>
												{/if}
											</div>
										{/each}
									{/each}
								{:else}
									<p class="text-xs italic text-zinc-600 text-center py-4">
										No cert history
									</p>
								{/if}
							</div>
						</aside>
					</div>

					<footer
						class="w-full px-5 py-3.5 border-t border-zinc-800 bg-zinc-950/40 flex flex-col sm:flex-row justify-end items-center gap-2.5 flex-shrink-0"
					>
						{#if pending}
							<Button
								class="bg-rose-600 hover:bg-rose-400 text-zinc-300 border border-rose-700 w-full sm:w-auto px-4 py-2 text-xs font-medium transition rounded-lg"
								onclick={rejectT2}
								disabled={projectDescriptionLength < 20 || loader}
							>
								Reject
							</Button>
							<Button
								class="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 w-full sm:w-auto px-4 py-2 text-xs font-medium transition rounded-lg"
								onclick={() => (justificationOpen = true)}
								oninput={generateFullJustification}
							>
								Preview Justification
							</Button>
							<Button
								class="bg-emerald-600 hover:bg-emerald-500 text-white w-full sm:w-auto px-5 py-2 text-xs font-medium transition rounded-lg flex items-center justify-center gap-x-2"
								onclick={sendToDatabase}
								disabled={projectDescriptionLength < 20 || loader}
							>
								{#if loader}
									<div
										class="border-2 border-emerald-200 border-t-white rounded-full w-3 h-3 animate-spin"
									></div>
								{/if}
								Push to Airtable
							</Button>
						{/if}
					</footer>
				{:else}
					<div
						class="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-2"
					>
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
								d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"
							/></svg
						>
						<p class="text-xl font-medium tracking-tight">
							Select a project from the left queue to review
						</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</main>

<ProjectDetailsDialog bind:open={detailsOpen} project={currentProject} />
{#if justificationOpen}
	<div
		class="generatedJustificationOverlay w-screen h-screen absolute top-0 bg-black/80 z-50 flex items-center justify-center"
	>
		<div class="w-1/2 h-1/2 bg-background rounded-lg p-5 flex flex-col gap-y-5">
			<h1 class="text-xl font-bold">Generated Justification</h1>
			<Textarea
				class="resize-none overflow-y-auto h-full"
				readonly
				bind:value={template}
			/>
			<Button
				onclick={() => (justificationOpen = false)}
				class="bg-red-900 w-full"
			>
				Close
			</Button>
		</div>
	</div>
{/if}
