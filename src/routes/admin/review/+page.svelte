<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte"
	import Input from "$lib/components/ui/input/input.svelte"
	import Textarea from "$lib/components/ui/textarea/textarea.svelte"
	import ProjectDetailsDialog from "$lib/components/projectdetails-dialog.svelte"
	import { invalidateAll } from "$app/navigation"
	import type { Project, AirtableProject, Log } from "$lib/types"
	import { countCharacters } from "$lib/utils"
	import { toast } from "svelte-sonner"
	import { Newspaper } from "lucide-svelte"
	import { readErrorMessage } from "$lib/http"
	import { safeHref } from "$lib/urls"

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
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
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
			toast.error(
				await readErrorMessage(response, "Failed to reject project. Please refresh.")
			)
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
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				recordId: proj.id,
				log: JSON.stringify(proj.log),
				internalNote: internal,
				userExternal: feedback,
				justification: autogenChangelog,
				decreaseTime: hours,
				theme: proj.category,
				slackId: proj.submittedBy,
				projectName: proj.name,
				projectLink: proj.code,
			}),
		})
		if (!response.ok) {
			toast.error(
				await readErrorMessage(response, "Failed to accept project. Please refresh.")
			)
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

<svelte:head>
	<title>Alchemize | T1 Review</title>
	<meta name="description" content="Alchemize T1 Review" />
	<meta property="og:title" content="Alchemize | T1 Review" />
</svelte:head>

<main
	class="w-screen h-screen text-primary font-sans overflow-hidden p-6 flex gap-6"
>
	<aside
		class="w-1/4 h-full rounded-2xl bg-card/40 border border-border/80 flex flex-col overflow-hidden shadow-xl"
	>
		<div class="p-4 border-b border-border bg-card/20">
			<h3
				class="font-bold text-muted-foreground text-xs tracking-wider uppercase flex items-center gap-2"
			>
				Project Queue
			</h3>
		</div>
		<div class="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
			{#each projects as item}
				{#if filterProjectByMode(item)}
					<button
						class="w-full text-left p-3.5 rounded-xl transition duration-200 group flex flex-col gap-2 border
                        {item.id === project.id
							? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-200 shadow-md'
							: 'bg-card/20 hover:bg-card/40 border-transparent text-muted-foreground hover:text-foreground'}"
						onclick={() => openProject(item.id)}
					>
						<h4
							class="font-semibold text-sm line-clamp-1 group-hover:text-primary-foreground transition"
						>
							{item.fields.Name || "Untitled Project"}
						</h4>
						<div
							class="flex items-center justify-between w-full text-xs text-muted-foreground"
						>
							<span
								class="font-mono bg-input px-2 py-0.5 rounded border border-border/60"
							>
								@{item.fields.slackId}
							</span>
							<span class="italic max-w-[50%] truncate">
								{item.fields.Theme || "No Category"}
							</span>
						</div>
					</button>
				{/if}
			{/each}
		</div>
	</aside>

	<div class="flex-1 h-full flex flex-col gap-4 overflow-hidden">
		<div class="flex items-center gap-x-3 shrink-0">
			<div class="relative group">
				<a href="review/t1guides">
					<button
						class="p-2.5 h-10 text-sm font-medium rounded-xl transition-all flex items-center gap-2 bg-card border border-border hover:bg-muted text-foreground hover:text-primary-foreground"
					>
						<Newspaper class="size-4" />
					</button>
				</a>
				<div
					class="absolute top-full left-0 mt-2 hidden group-hover:block p-2 z-50 bg-card border border-border rounded-lg text-xs text-foreground shadow-xl"
				>
					Guides
				</div>
			</div>

			<nav
				class="w-full flex items-center justify-evenly gap-2 p-1 bg-card/60 border border-border/80 rounded-xl"
			>
				<button
					onclick={() => (mode = 1)}
					class="px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2
                    {mode === 1
						? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					Pending
					<span
						class="px-1.5 py-0.5 text-[10px] font-mono rounded bg-input border border-border text-amber-500"
						>{pendingCount}</span
					>
				</button>

				<button
					onclick={() => (mode = 3)}
					class="px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2
                    {mode === 3
						? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					Rejected
					<span
						class="px-1.5 py-0.5 text-[10px] font-mono rounded bg-input border border-border text-rose-500"
						>{rejectedCount}</span
					>
				</button>

				<button
					onclick={() => (mode = 2)}
					class="px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2
                    {mode === 2
						? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					Approved
					<span
						class="px-1.5 py-0.5 text-[10px] font-mono rounded bg-input border border-border text-emerald-500"
						>{approvedCount}</span
					>
				</button>

				<div class="h-4 w-px bg-border mx-1"></div>

				<button
					onclick={() => (mode = 0)}
					class="px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2
                    {mode === 0
						? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					Total
					<span
						class="px-1.5 py-0.5 text-[10px] font-mono rounded bg-input border border-border text-indigo-400"
						>{totalCount}</span
					>
				</button>
			</nav>
		</div>

		<div
			class="flex-1 bg-card/20 border border-border rounded-2xl flex flex-col min-h-0 overflow-hidden backdrop-blur-sm"
		>
			{#if !project.name}
				<div
					class="flex-1 flex flex-col items-center justify-center text-muted-foreground/60 gap-3"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="44"
						height="44"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="text-muted-foreground/70"
					>
						<path
							d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"
						/>
					</svg>
					<p class="text-base font-medium tracking-tight text-muted-foreground">
						Select a project from the left queue to review
					</p>
				</div>
			{:else}
				<div class="flex-1 flex flex-col min-h-0 w-full animate-fadeIn">
					<div
						class="p-6 border-b border-border bg-card/10 flex items-start justify-between gap-4 shrink-0"
					>
						<div class="flex flex-col gap-1.5">
							<div class="flex items-center gap-3 flex-wrap">
								<h1 class="text-xl font-bold tracking-tight text-foreground">
									{project.name}
								</h1>
								<span
									class="px-2.5 py-0.5 text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400"
								>
									{project.hours} Hours Tracked
								</span>
								<Button
									onclick={() => (detailsOpen = true)}
									variant="outline"
									size="sm"
									class="h-7 border-border bg-card/50 text-foreground hover:text-primary-foreground text-xs"
								>
									Full Details
								</Button>
							</div>
							<p
								class="text-xs text-muted-foreground flex gap-x-2 items-center divide-x divide-border"
							>
								<span class="pr-2"
									><strong>Creator:</strong> @{project.submittedBy}</span
								>
								<span class="pr-2">
									<strong>Type:</strong>
									<span class="capitalize">{project.type}</span>
								</span>
								<span class="pr-2"
									><strong>Category:</strong> {project.category}</span
								>
							</p>
						</div>

						<div class="flex items-center gap-2">
							<a
								href={safeHref(project.demo)}
								target="_blank"
								rel="noreferrer noopener"
								class="px-3 py-1.5 text-xs font-medium bg-card border border-border text-foreground hover:bg-muted hover:text-primary-foreground rounded-lg transition"
								>Demo</a
							>
							<a
								href={safeHref(project.code)}
								target="_blank"
								rel="noreferrer noopener"
								class="px-3 py-1.5 text-xs font-medium bg-card border border-border text-foreground hover:bg-muted hover:text-primary-foreground rounded-lg transition"
								>Repository</a
							>
							<a
								href={safeHref(project.readme)}
								target="_blank"
								rel="noreferrer noopener"
								class="px-3 py-1.5 text-xs font-medium bg-card border border-border text-foreground hover:bg-muted hover:text-primary-foreground rounded-lg transition"
								>Readme</a
							>
						</div>
					</div>

					<div
						class="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 overflow-hidden"
					>
						<div
							class="h-full overflow-y-auto p-6 space-y-5 border-r border-border custom-scrollbar"
						>
							<div class="flex flex-col gap-2">
								<label
									for="userFeedback"
									class="text-xs font-bold uppercase tracking-wider text-muted-foreground"
									>User Feedback Message</label
								>
								<div
									class="px-3 py-2 rounded-xl border text-xs flex items-center gap-2 transition duration-200
                                    {userExternalCount >= 20
										? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
										: 'bg-amber-500/5 border-amber-500/20 text-amber-400'}"
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
									>
										<circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path
											d="M12 8h.01"
										/>
									</svg>
									<span>
										{userExternalCount >= 20
											? "Feedback criteria accepted for execution."
											: `Requires at least 20 characters (${userExternalCount}/20)`}
									</span>
								</div>
								<Textarea
									id="userFeedback"
									class="min-h-[100px] bg-input border-border text-foreground focus:ring-1 focus:ring-indigo-500 focus:border-transparent resize-none text-sm leading-relaxed"
									placeholder="Type the user feedback here...."
									bind:value={userExternal}
								/>
							</div>

							<div
								class="flex flex-col gap-3 bg-card/40 border border-border/60 p-4 rounded-xl"
							>
								<div class="flex items-center justify-between gap-4">
									<div class="flex flex-col">
										<!-- svelte-ignore a11y_label_has_associated_control -->
										<label
											id="override"
											class="text-xs font-bold uppercase tracking-wider text-muted-foreground"
											>Override Hours</label
										>
										<p class="text-[11px] text-muted-foreground">
											Deduct hours from project metrics
										</p>
									</div>
									<Input
										id="override"
										class="w-24 h-9 bg-input border-border text-center text-foreground focus:ring-1 focus:ring-indigo-500"
										type="number"
										bind:value={overrideHours}
										min="0"
									/>
								</div>
								<div class="mt-1">
									<label
										for="justification"
										class="text-[11px] font-semibold text-muted-foreground block mb-1"
										>Generated Submission Justification</label
									>
									<Textarea
										id="justification"
										class="min-h-[100px] font-mono text-xs bg-input border-border text-muted-foreground resize-none leading-relaxed"
										readonly
										bind:value={autogenChangelog}
									/>
								</div>
							</div>
						</div>

						<div
							class="h-full overflow-y-auto p-6 space-y-5 bg-card/5 custom-scrollbar"
						>
							<div class="flex flex-col gap-2">
								<label
									for="internalNote"
									class="text-xs font-bold uppercase tracking-wider text-muted-foreground"
									>Internal Review Notes <span
										class="text-muted-foreground/60 font-normal lowercase"
										>(optional)</span
									></label
								>
								<Textarea
									id="internalNote"
									class="min-h-[90px] bg-input border-border text-foreground focus:ring-1 focus:ring-indigo-500 focus:border-transparent resize-none text-sm leading-relaxed"
									placeholder="Internal reviewers' notes."
									bind:value={internalNote}
								/>
							</div>
							<div class="flex flex-col gap-2">
								<h3
									class="text-xs font-bold uppercase tracking-wider text-muted-foreground"
								>
									Certification Logs & History
								</h3>
								<div
									class="border border-border bg-input/40 rounded-xl p-4 overflow-y-auto wrap-break-word space-y-3 custom-scrollbar"
								>
									{#if project.log && project.log.length > 0}
										{#each [...project.log].reverse() as entry}
											{#each [...entry.message].reverse() as msg, i}
												<div
													class="border {msg.reviewerName === 'user'
														? 'border-l-amber-500'
														: i === 0 || msg.reviewerName?.includes('APPROVED')
															? entry.status === 1 ||
																msg.reviewerName?.includes('APPROVED')
																? 'border-l-emerald-500'
																: 'border-l-rose-500'
															: 'border-l-rose-500'} border-border/80 bg-card/20 p-3 rounded-lg space-y-2 text-xs"
												>
													<div
														class="flex items-center justify-between border-b border-border pb-1.5 text-[11px] text-muted-foreground"
													>
														<span class="font-bold text-muted-foreground"
															>Reviewer: <span class="text-indigo-400 font-mono"
																>@{msg.reviewerName || "staff"}</span
															></span
														>
														<span
															>{new Date(msg.timestamp).toLocaleString()}</span
														>
													</div>
													{#if msg.userExternal}
														<p class="text-foreground leading-relaxed">
															<strong
																class="text-[10px] uppercase tracking-wider text-muted-foreground block mb-0.5"
																>Feedback Note:</strong
															>
															{msg.userExternal}
														</p>
													{/if}
													{#if msg.internalNote}
														<p
															class="text-muted-foreground italic bg-card/30 p-2 rounded border border-border/20"
														>
															<strong
																class="text-[10px] uppercase tracking-wider text-muted-foreground/60 block not-italic mb-0.5"
																>Internal Note:</strong
															>
															{msg.internalNote}
														</p>
													{/if}
												</div>
											{/each}
										{/each}
									{:else}
										<p
											class="text-xs italic text-muted-foreground/60 text-center py-4"
										>
											No cert history
										</p>
									{/if}
								</div>
							</div>
						</div>
					</div>

					<div
						class="shrink-0 flex items-center justify-end gap-3 p-4 border-t border-border bg-input/60 backdrop-blur-sm"
					>
						<button
							class="h-10 py-2 px-5 font-bold uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-primary-foreground shadow-lg shadow-rose-950/20 transition duration-150 disabled:opacity-40"
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
									class="border-2 border-border border-t-primary-foreground rounded-full animate-spin h-3.5 w-3.5"
								></div>
							{/if}
							Reject Submission
						</button>

						<button
							class="h-10 py-2 px-5 font-bold uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-primary-foreground shadow-lg shadow-emerald-950/20 transition duration-150 disabled:opacity-40"
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
									class="border-2 border-border border-t-primary-foreground rounded-full animate-spin h-3.5 w-3.5"
								></div>
							{/if}
							Approve Submission
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</main>

<ProjectDetailsDialog bind:open={detailsOpen} {project} />

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 4px;
		height: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: var(--muted);
		border-radius: 2px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: var(--border);
	}
</style>
