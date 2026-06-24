<script lang="ts">
	import ProjectDetailsDialog from "$lib/components/projectdetails-dialog.svelte"
	import Button from "$lib/components/ui/button/button.svelte"
	import Input from "$lib/components/ui/input/input.svelte"
	import Textarea from "$lib/components/ui/textarea/textarea.svelte"
	import type { Project, Log, AirtableProject } from "$lib/types"
	import { toast } from "svelte-sonner"
	import { invalidateAll } from "$app/navigation"
	import { countCharacters } from "$lib/utils"
	import { cn } from "$lib/lib/utils"
	interface AdminProjectAccess extends AirtableProject {
		fields: AirtableProject["fields"] & {
			unifiedId: string
		}
	}
	interface AdminProject extends Project {
		unifiedId: string
	}
	let detailsOpen = $state(false)
	let { data } = $props()
	let airtableProjects = $derived(data.projects as AdminProjectAccess[])
	let project = $state({} as Project)
	let justificationOpen = $state(false)
	const wasEverApproved = (project: AirtableProject) => {
		//Checks the logs and returns true if there was ever an approved log, that is not sent to airtable (aka not pushed)
		const logs = JSON.parse(project.fields.log || "[]") as Log[]
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
	const setCurrentProject = (nextProject: AdminProjectAccess) => {
		currentProject = {
			id: nextProject.id,
			name: nextProject.fields.Name,
			hours: Math.floor(
				calculateRecordedTime(
					JSON.parse(nextProject.fields.log ?? "[]") as Log[]
				) / 60
			),
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
			unifiedId: nextProject.fields.unifiedId,
		}
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
				for (const message of entry.message ) {
					if (message.reviewerName === "user") {
											userLogs += `User written logs: ${message.userExternal} \n`

					}
				}
				let deltaTime = `Delta: ${Math.floor(entry.deltaTime / 60)} hours`
				let finalEnry = `${userLogs}${deltaTime} \nApproved by: ${approvedBy} \n\n`
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
Delta:${calculateDelta(currentProject.log)} hours, Adjusted to:${calculateDelta(currentProject.log) - subtraction} Subtract ${subtraction} hours
${projectDescription}
${currentProject.update || currentProject.log.length > 1 ? `Changelog: ${changelogs}` : ``}
There are ${gitCommits} git commits and approximately ${gitCommits > 0 ? Math.floor(gitCommits / currentProject.hours) : 0} commits/hr
${subtraction > 0 ? `The reason for overriding hours is: ${reasonForOverride}` : ``}

User written logs:
${generateUserLogs(currentProject.log)}

Full review log available at link:https://alchemize.hackclub.com/admin/review2/${currentProject.unifiedId}

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
	const sendToDatabase = async () => {
		const response = await fetch("/admin/review2/sendToAirtable", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				projectId: currentProject.id,
				justification: template,
				subtraction,
			}),
		})
		if (response.ok) {
			toast.success(
				"Pushed " + currentProject.name + " to Airtable successfully!"
			)
			loader = false
			airtableProjects = airtableProjects.filter(
				p => p.id !== currentProject.id
			)
			invalidateAll()
			currentProject = {} as AdminProject
		} else {
			toast.error("Failed to push project to Airtable. Please referesh")
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
				areAllPushedToHQ(JSON.parse(project.fields.log ?? "[]") as Log[]) !==
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
			areAllPushedToHQ(JSON.parse(project.fields.log ?? "[]") as Log[]),
			" | Pending: ",
			pending
		)
	})
	
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
						{pending ? "No pending projects 🥳" : "No sent projects 😕"}
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
								rel="noreferrer"
								class="text-[11px] font-medium px-2.5 py-1 bg-admin-primary/20 hover:bg-admin-primary/30 text-admin-text rounded-md transition"
								>Demo</a
							>
							<a
								href={currentProject.code}
								target="_blank"
								rel="noreferrer"
								class="text-[11px] font-medium px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition"
								>Repo</a
							>
						</div>
					</header>

					<div
						class="flex-1 overflow-hidden grid grid-cols-1 xl:grid-cols-3 min-h-0"
					>
						<main
							class="xl:col-span-2 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-5 content-start border-b xl:border-b-0 xl:border-r border-zinc-800 custom-scrollbar"
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

						<aside
							class="xl:col-span-1 bg-zinc-950/10 flex flex-col overflow-hidden h-full border-t xl:border-t-0 border-zinc-800"
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
								class="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar min-h-0"
							>
								{#each currentProject.log as log}
									<div
										class="p-2.5 bg-zinc-900/15 border border-zinc-800/60 rounded-lg space-y-2 text-xs wrap-break-word"
									>
										<div class="flex items-center justify-between gap-2">
											<span class="font-medium text-zinc-300">Review</span>
											<span
												class="text-[9px] font-medium bg-emerald-950/40 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-900/30"
											>
												Approved
											</span>
										</div>

										<div
											class="text-[11px] text-zinc-500 bg-zinc-950/30 p-2 rounded border border-zinc-900 space-y-1 font-mono"
										>
											<div class="text-zinc-300">
												User Feedback: {log.message.at(-1)?.userExternal ||
													"No user feedback"}
											</div>

											{log.message.at(-1)?.justification || "No notes yet."}
											<div class="text-zinc-500 text-xs">
												By {log.message.at(-1)?.reviewerName || "Unknown User"}
											</div>
										</div>
									</div>
								{/each}
							</div>
						</aside>
					</div>

					<footer
						class="w-full px-5 py-3.5 border-t border-zinc-800 bg-zinc-950/40 flex flex-col sm:flex-row justify-end items-center gap-2.5 flex-shrink-0"
					>
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
						>
							{#if loader}
								<div
									class="border-2 border-emerald-200 border-t-white rounded-full w-3 h-3 animate-spin"
								></div>
							{/if}
							Push to Airtable
						</Button>
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
