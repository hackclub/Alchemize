<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte"
	import Input from "$lib/components/ui/input/input.svelte"
	import Textarea from "$lib/components/ui/textarea/textarea.svelte"
	import ProjectDetailsDialog from "$lib/components/projectdetails-dialog.svelte"
	import { invalidateAll } from "$app/navigation"
	import type { Project, AirtableProject, Log } from "$lib/types"
	import { countCharacters } from "$lib/utils"
	import { toast } from "svelte-sonner"

	let { data } = $props()
	let detailsOpen = $state(false)
	let projects: AirtableProject[] = $derived(data?.projects ?? [])

	let userExternal = $state("")
	let internalNote = $state("")
	let overrideHours = $state(0)
	let userExternalCount = $derived(countCharacters(userExternal))
	let project = $state({} as Project)

	let pendingCount = $derived(
		projects.filter(p => p.fields.status?.startsWith("pending")).length
	)
	let approvedCount = $derived(
		projects.filter(p => p.fields.status?.startsWith("accepted")).length
	)
	let rejectedCount = $derived(
		projects.filter(p => p.fields.status?.startsWith("rejected")).length
	)
	let totalCount = $derived(projects.length)

	function calculateRecordedTime(log: Log[]): number {
		return log.reduce((total, entry) => total + entry.deltaTime, 0)
	}

	let autogenChangelog = $state("")
	const generateChangelog = (targetProject: Project) => {
		if (!targetProject.name) return ""
		const hackatimeLine = `User tracked ${targetProject.hours} hours on Hackatime project: ${targetProject.hackatime}.\n`
		const isUpdateLine = targetProject.update
			? "This submission is an update to a previous one.\n"
			: "This is the user's first submission for this project.\n"
		const time =
			targetProject.log.length > 1
				? Math.floor(
						targetProject.log[targetProject.log.length - 1].deltaTime / 60
					)
				: targetProject.hours
		const delta =
			"Delta is: " +
			time +
			" hours \t Adjustment: Subtracted " +
			overrideHours +
			" hours from delta(New hours: " +
			(time - overrideHours) +
			").\n"

		let changes = ""
		targetProject.log[targetProject.log.length - 1]?.message.forEach(msg => {
			if (msg.reviewerName === "user") {
				changes += `User's Logs: ${msg.userExternal}\n`
			}
		})
		return `${hackatimeLine}${isUpdateLine}${delta}${changes}`
	}

	$effect(() => {
		if (project.name) {
			autogenChangelog = generateChangelog(project)
		}
	})

	const openProject = (projectId: string) => {
		invalidateAll()
		const nextProject = projects.find(
			(item: AirtableProject) => item.id === projectId
		)
		if (nextProject) {
			project = {
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
			} as Project
			autogenChangelog = generateChangelog(project)
		}
	}

	let mode = $state(1) // 0 = all, 1 = pending, 2 = approved, 3 = rejected
	let filterProjectByMode = (p: AirtableProject) => {
		if (mode === 0) return true
		if (p.fields.status?.startsWith("pending") && mode === 1) return true
		if (p.fields.status?.startsWith("accepted") && mode === 2) return true
		if (p.fields.status?.startsWith("rejected") && mode === 3) return true
		return false
	}

	let rejectLoader = $state(false)
	let acceptLoader = $state(false)

	const rejectProject = async (
		proj: Project,
		feedback: string,
		internal: string,
		hours: number
	) => {
		rejectLoader = true
		if (userExternalCount < 20) {
			toast.error("Please provide sufficient user feedback before rejecting.")
			rejectLoader = false
			return
		}
		const response = await fetch("/admin/review/reject", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				recordId: proj.id,
				log: JSON.stringify(proj.log),
				internalNote: internal,
				userExternal: feedback,
				justification: autogenChangelog,
				decreaseTime: hours,
				slackId: proj.submittedBy,
				projectName: proj.name,
				projectLink: proj.code,
			}),
		})
		if (!response.ok) {
			toast.error("Failed to reject project. Please refresh.")
			rejectLoader = false
			return
		}
		toast.success(`Rejected ${proj.name} successfully!`)
		const { newLog } = await response.json()
		proj.log = newLog
		rejectLoader = false
		projects = projects.map(p =>
			p.id === proj.id
				? { ...p, fields: { ...p.fields, status: "rejected" } }
				: p
		)
	}

	const acceptProject = async (
		proj: Project,
		feedback: string,
		internal: string,
		hours: number
	) => {
		acceptLoader = true
		if (userExternalCount < 20) {
			toast.error("Please provide sufficient user feedback before approving.")
			acceptLoader = false
			return
		}
		const response = await fetch("/admin/review/accept", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				recordId: proj.id,
				log: JSON.stringify(proj.log),
				internalNote: internal,
				userExternal: feedback,
				justification: autogenChangelog,
				decreaseTime: hours,
				theme: proj.category,
				userEmailId: proj.owner,
				slackId: proj.submittedBy,
				projectName: proj.name,
				projectLink: proj.code,
			}),
		})
		if (!response.ok) {
			toast.error("Failed to accept project. Please refresh.")
			acceptLoader = false
			return
		}
		const { newLog } = await response.json()
		proj.log = newLog
		acceptLoader = false
		toast.success(`Accepted ${proj.name} successfully!`)
		projects = projects.map(p =>
			p.id === proj.id
				? { ...p, fields: { ...p.fields, status: "accepted" } }
				: p
		)
	}
</script>

<main
	class="w-screen h-screen text-admin-text font-sans overflow-hidden p-6 flex gap-6"
>
	<aside
		class="w-1/4 h-full rounded-2xl bg-zinc-900/50 border border-zinc-800 flex flex-col overflow-hidden"
	>
		<div class="p-4 border-b border-zinc-800 bg-zinc-900/20">
			<h3 class="font-semibold text-zinc-400 text-sm tracking-wider uppercase">
				Project Queue
			</h3>
		</div>
		<div
			class="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-zinc-800/30"
		>
			{#each projects as item}
				{#if filterProjectByMode(item)}
					<button
						class="w-full text-left p-3 rounded-xl transition duration-200 group flex flex-col gap-1.5
                        {item.id === project.id
							? 'bg-indigo-600/10 border border-indigo-500/30 text-indigo-200'
							: 'hover:bg-zinc-800/60 border border-transparent text-zinc-300'}"
						onclick={() => openProject(item.id)}
					>
						<h4
							class="font-semibold text-base line-clamp-1 group-hover:text-white transition"
						>
							{item.fields.Name || "Untitled Project"}
						</h4>
						<div
							class="flex items-center justify-between w-full text-xs text-zinc-500 group-hover:text-zinc-400"
						>
							<span
								class="font-mono bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800/60"
								>@{item.fields.slackId}</span
							>
							<span class="italic max-w-[50%] truncate"
								>{item.fields.Theme || "No Category"}</span
							>
						</div>
					</button>
				{/if}
			{/each}
		</div>
	</aside>

	<div class="flex-1 h-full flex flex-col gap-6 overflow-hidden">
		<nav
			class="w-full flex items-center justify-evenly gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-xl self-start"
		>
			<button
				onclick={() => (mode = 1)}
				class="px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2
                {mode === 1
					? 'bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20'
					: 'text-zinc-400 hover:text-zinc-200'}"
			>
				Pending <span
					class="px-1.5 py-0.5 text-xs rounded bg-zinc-950 border border-zinc-800 text-amber-500"
					>{pendingCount}</span
				>
			</button>

			<button
				onclick={() => (mode = 3)}
				class="px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2
                {mode === 3
					? 'bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/20'
					: 'text-zinc-400 hover:text-zinc-200'}"
			>
				Rejected <span
					class="px-1.5 py-0.5 text-xs rounded bg-zinc-950 border border-zinc-800 text-rose-500"
					>{rejectedCount}</span
				>
			</button>

			<button
				onclick={() => (mode = 2)}
				class="px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2
                {mode === 2
					? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20'
					: 'text-zinc-400 hover:text-zinc-200'}"
			>
				Approved <span
					class="px-1.5 py-0.5 text-xs rounded bg-zinc-950 border border-zinc-800 text-emerald-500"
					>{approvedCount}</span
				>
			</button>

			<div class="h-4 w-px bg-zinc-800 mx-1"></div>

			<button
				onclick={() => (mode = 0)}
				class="px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2
                {mode === 0
					? 'bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20'
					: 'text-zinc-400 hover:text-zinc-200'}"
			>
				Total <span
					class="px-1.5 py-0.5 text-xs rounded bg-zinc-950 border border-zinc-800 text-indigo-400"
					>{totalCount}</span
				>
			</button>
		</nav>

		<div
			class="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 overflow-y-auto"
		>
			{#if !project.name}
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
			{:else}
				<div class="w-full flex flex-col gap-6 animate-fadeIn">
					<div
						class="flex items-start justify-between border-b border-zinc-800 pb-5"
					>
						<div class="flex flex-col gap-1.5">
							<div class="flex items-center gap-3 flex-wrap">
								<h1 class="text-2xl font-bold tracking-tight text-white">
									{project.name}
								</h1>
								<span
									class="px-2.5 py-1 text-xs font-semibold bg-zinc-800 border border-zinc-700 rounded-full text-indigo-400"
								>
									{project.hours} Hours Tracked
								</span>
								<Button
									onclick={() => (detailsOpen = true)}
									variant="outline"
									size="sm"
									class="border-zinc-700 text-zinc-300 hover:text-white"
								>
									Full Details
								</Button>
							</div>
							<p
								class="text-xs text-zinc-400 flex gap-x-2 items-center divide-x divide-zinc-800"
							>
								<span><strong>Creator:</strong> @{project.submittedBy}</span>
								<span class="pl-2"><strong>Type:</strong> {project.type}</span>
								<span class="pl-2"
									><strong>Category:</strong> {project.category}</span
								>
							</p>
						</div>

						<div class="flex items-center gap-2">
							<a
								href={project.demo}
								target="_blank"
								class="px-3 py-1.5 text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white rounded-lg transition"
								>Demo</a
							>
							<a
								href={project.code}
								target="_blank"
								class="px-3 py-1.5 text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white rounded-lg transition"
								>Repository</a
							>
							<a
								href={project.readme}
								target="_blank"
								class="px-3 py-1.5 text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white rounded-lg transition"
								>Readme</a
							>
						</div>
					</div>

					<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<div class="flex flex-col gap-5">
							<div class="flex flex-col gap-2">
								<label
									for="userFeedback"
									class="text-sm font-medium text-zinc-300"
									>User Feedback Message</label
								>
								<div
									class="px-3 py-2 rounded-lg border text-xs flex items-center gap-2 transition duration-200
                                    {userExternalCount >= 20
										? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
										: 'bg-amber-500/10 border-amber-500/20 text-amber-400'}"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										><circle cx="12" cy="12" r="10" /><path
											d="M12 16v-4"
										/><path d="M12 8h.01" /></svg
									>
									<span>
										{userExternalCount >= 20
											? "Feedback criteria accepted for execution."
											: `Requires at least 20 characters (${userExternalCount}/20)`}
									</span>
								</div>
								<Textarea
									id="userFeedback"
									class="min-h-[90px] bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-indigo-500 focus:ring-indigo-500/20"
									placeholder="Type the user feedback here...."
									bind:value={userExternal}
								/>
							</div>

							<div class="flex flex-col gap-2">
								<label
									for="internalNote"
									class="text-sm font-medium text-zinc-300"
									>Internal Review Notes <span class="text-zinc-500 font-normal"
										>(Optional)</span
									></label
								>
								<Textarea
									id="internalNote"
									class="min-h-[80px] bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-indigo-500 focus:ring-indigo-500/20"
									placeholder="Internal reviewers' notes."
									bind:value={internalNote}
								/>
							</div>

							<div
								class="flex flex-col gap-2 bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-xl"
							>
								<div class="flex items-center justify-between gap-4">
									<div class="flex flex-col">
										<label
											for="override"
											class="text-sm font-medium text-zinc-200"
											>Override Hours</label
										>
										<p class="text-xs text-zinc-500">
											Deduc hours from project
										</p>
									</div>
									<Input
										id="override"
										class="w-24 bg-zinc-950 border-zinc-800 text-center text-zinc-100"
										type="number"
										bind:value={overrideHours}
										min="0"
									/>
								</div>
								<div class="mt-3">
									<label
										for="justification"
										class="text-xs font-medium text-zinc-400 block mb-1"
										>Generated Submission Justification</label
									>
									<Textarea
										id="justification"
										class="min-h-[120px] font-mono text-xs bg-zinc-950 border-zinc-800 text-zinc-400"
										bind:value={autogenChangelog}
									/>
								</div>
							</div>

							<div class="grid grid-cols-2 gap-3 mt-2">
								<button
									class="py-2.5 px-4 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-lg shadow-emerald-950/20 transition duration-150 disabled:opacity-50"
									disabled={userExternalCount < 20 || acceptLoader}
									onclick={() =>
										acceptProject(
											project,
											userExternal,
											internalNote,
											overrideHours
										)}
								>
									{#if acceptLoader}
										<div
											class="border-2 border-zinc-400 border-t-white rounded-full animate-spin h-4 w-4"
										></div>
									{/if}
									Approve Project
								</button>
								<button
									class="py-2.5 px-4 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-lg shadow-rose-950/20 transition duration-150 disabled:opacity-50"
									disabled={userExternalCount < 20 || rejectLoader}
									onclick={() =>
										rejectProject(
											project,
											userExternal,
											internalNote,
											overrideHours
										)}
								>
									{#if rejectLoader}
										<div
											class="border-2 border-zinc-400 border-t-white rounded-full animate-spin h-4 w-4"
										></div>
									{/if}
									Reject Project
								</button>
							</div>
						</div>

						<div class="flex flex-col gap-5">
							<div class="flex flex-col gap-2">
								<h3 class="text-sm font-medium text-zinc-300">
									Internal Notes
								</h3>
								<div
									class="p-3 bg-zinc-950 border border-zinc-800 rounded-xl min-h-[80px] text-xs text-zinc-400 italic"
								>
									{project.description ||
										"No project description provided by the author."}
								</div>
							</div>

							<div class="flex flex-col gap-2 flex-1 min-h-[300px]">
								<h3 class="text-sm font-medium text-zinc-300">
									Certification History
								</h3>
								<div
									class="flex-1 border border-zinc-800 bg-zinc-950/50 rounded-xl p-3 overflow-y-auto space-y-3 max-h-[460px]"
								>
									{#each [...project.log].reverse() as LogEntry}
										{#each [...LogEntry.message].reverse() as msg, i}
											<div
												class="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg flex flex-col gap-2 text-xs"
											>
												<div
													class="flex items-center justify-between gap-2 border-b border-zinc-800 pb-1.5"
												>
													<div class="flex items-center gap-2">
														<div
															class="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono font-bold text-[10px] text-zinc-400"
														>
															{msg.reviewerName?.charAt(0).toUpperCase() || "A"}
														</div>
														<span class="font-bold text-zinc-200"
															>{msg.reviewerName === "user"
																? "Project Author"
																: msg.reviewerName}</span
														>
													</div>
													<span
														class="px-2 py-0.5 rounded text-[10px] font-semibold
                                                        {msg.reviewerName ===
														'user'
															? 'bg-amber-500/10 text-amber-400'
															: i === 0 && LogEntry.status === 1
																? 'bg-emerald-500/10 text-emerald-400'
																: 'bg-rose-500/10 text-rose-400'}"
													>
														{msg.reviewerName === "user"
															? "Ship Submission"
															: i === 0 && LogEntry.status === 1
																? "Approved"
																: "Rejected"}
													</span>
												</div>

												{#if msg.reviewerName === "user"}
													<p
														class="text-zinc-400 leading-relaxed font-mono text-[11px] bg-zinc-950/40 p-1.5 rounded border border-zinc-900"
													>
														Logged: {new Date(msg.timestamp).toLocaleString()}
													</p>
												{/if}

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
														class="text-zinc-500 italic bg-zinc-900/30 p-1.5 rounded border border-transparent"
													>
														<strong
															class="text-[10px] uppercase tracking-wider text-zinc-600 block not-italic mb-0.5"
															>Internal Staff Note:</strong
														>
														{msg.internalNote}
													</p>
												{/if}
											</div>
										{/each}
									{/each}
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</main>

<ProjectDetailsDialog bind:open={detailsOpen} {project} />

<style>
	/* Clean fluid animations for loaded panel view switching */
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	:global(.animate-fadeIn) {
		animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}
</style>
