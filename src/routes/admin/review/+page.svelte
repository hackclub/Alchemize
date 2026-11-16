<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte"
	import Input from "$lib/components/ui/input/input.svelte"
	import Textarea from "$lib/components/ui/textarea/textarea.svelte"
	import ProjectDetailsDialog from "$lib/components/projectdetails-dialog.svelte"
	import { invalidateAll } from "$app/navigation"
	import type { Project, AirtableProject, Log } from "$lib/types"
	import { totalLogMinutes } from "$lib/reviewTools"
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

	let pendingCount = $derived(projects.filter(p => p.fields.status?.startsWith("pending")).length)
	let approvedCount = $derived(projects.filter(p => p.fields.status?.startsWith("accepted")).length)
	let rejectedCount = $derived(projects.filter(p => p.fields.status?.startsWith("rejected")).length)
	let totalCount = $derived(projects.length)

	let autogenChangelog = $state("")
	const generateChangelog = (targetProject: Project) => {
		if (!targetProject.name) return ""
		const hackatimeLine = `User tracked ${targetProject.hours} hours on Hackatime project: ${targetProject.hackatime}.\n`
		const isUpdateLine = targetProject.update
			? "This submission is an update to a previous one.\n"
			: "This is the user's first submission for this project.\n"
		const time =
			targetProject.log.length > 1
				? Math.floor(targetProject.log[targetProject.log.length - 1].deltaTime / 60)
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
		const nextProject = projects.find((item: AirtableProject) => item.id === projectId)
		if (nextProject) {
			project = {
				id: nextProject.id,
				name: nextProject.fields.Name,
				hours: Math.floor(totalLogMinutes(JSON.parse(nextProject.fields.log ?? "[]") as Log[]) / 60),
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
	const filterProjectByMode = (p: AirtableProject) => {
		if (mode === 0) return true
		if (p.fields.status?.startsWith("pending") && mode === 1) return true
		if (p.fields.status?.startsWith("accepted") && mode === 2) return true
		if (p.fields.status?.startsWith("rejected") && mode === 3) return true
		return false
	}

	let rejectLoader = $state(false)
	let acceptLoader = $state(false)

	const rejectProject = async (proj: Project, feedback: string, internal: string, hours: number) => {
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
			toast.error(await readErrorMessage(response, "Failed to reject project. Please refresh."))
			rejectLoader = false
			return
		}
		toast.success(`Rejected ${proj.name} successfully!`)
		const { newLog } = await response.json()
		proj.log = newLog
		rejectLoader = false
		projects = projects.map(p => (p.id === proj.id ? { ...p, fields: { ...p.fields, status: "rejected" } } : p))
	}

	const acceptProject = async (proj: Project, feedback: string, internal: string, hours: number) => {
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
			toast.error(await readErrorMessage(response, "Failed to accept project. Please refresh."))
			acceptLoader = false
			return
		}
		const { newLog, telescreen } = await response.json()
		proj.log = newLog
		acceptLoader = false
		toast.success(`Accepted ${proj.name} successfully!`)
		if (telescreen && !telescreen.ok) {
			toast.warning(
				`${proj.name} wasn't sent to Telescreen (${telescreen.message}). A T2 reviewer can retry it from the T2 page.`
			)
		}
		projects = projects.map(p => (p.id === proj.id ? { ...p, fields: { ...p.fields, status: "accepted" } } : p))
	}
</script>

<svelte:head>
	<title>Alchemize | T1 Review</title>
	<meta name="description" content="Alchemize T1 Review" />
	<meta property="og:title" content="Alchemize | T1 Review" />
</svelte:head>

<main class="flex h-screen w-screen gap-6 overflow-hidden p-6 font-sans text-primary">
	<aside class="flex h-full w-1/4 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/40 shadow-xl">
		<div class="border-b border-border bg-card/20 p-4">
			<h3 class="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
				Project Queue
			</h3>
		</div>
		<div class="custom-scrollbar flex-1 space-y-2 overflow-y-auto p-3">
			{#each projects as item (item.id)}
				{#if filterProjectByMode(item)}
					<button
						class="group flex w-full flex-col gap-2 rounded-xl border p-3.5 text-left transition duration-200
                        {item.id === project.id
							? 'border-indigo-500/40 bg-indigo-600/10 text-indigo-200 shadow-md'
							: 'border-transparent bg-card/20 text-muted-foreground hover:bg-card/40 hover:text-foreground'}"
						onclick={() => openProject(item.id)}>
						<h4 class="line-clamp-1 text-sm font-semibold transition group-hover:text-primary-foreground">
							{item.fields.Name || "Untitled Project"}
						</h4>
						<div class="flex w-full items-center justify-between text-xs text-muted-foreground">
							<span class="rounded border border-border/60 bg-input px-2 py-0.5 font-mono">
								@{item.fields.slackId}
							</span>
							<span class="max-w-[50%] truncate italic">
								{item.fields.Theme || "No Category"}
							</span>
						</div>
					</button>
				{/if}
			{/each}
		</div>
	</aside>

	<div class="flex h-full flex-1 flex-col gap-4 overflow-hidden">
		<div class="flex shrink-0 items-center gap-x-3">
			<div class="group relative">
				<a href="review/t1guides">
					<button
						class="flex h-10 items-center gap-2 rounded-xl border border-border bg-card p-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted hover:text-primary-foreground">
						<Newspaper class="size-4" />
					</button>
				</a>
				<div
					class="absolute top-full left-0 z-50 mt-2 hidden rounded-lg border border-border bg-card p-2 text-xs text-foreground shadow-xl group-hover:block">
					Guides
				</div>
			</div>

			<nav class="flex w-full items-center justify-evenly gap-2 rounded-xl border border-border/80 bg-card/60 p-1">
				<button
					onclick={() => (mode = 1)}
					class="flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all
                    {mode === 1
						? 'border border-amber-500/20 bg-amber-500/10 text-amber-400'
						: 'text-muted-foreground hover:text-foreground'}">
					Pending
					<span class="rounded border border-border bg-input px-1.5 py-0.5 font-mono text-[10px] text-amber-500"
						>{pendingCount}</span>
				</button>

				<button
					onclick={() => (mode = 3)}
					class="flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all
                    {mode === 3
						? 'border border-rose-500/20 bg-rose-500/10 text-rose-400'
						: 'text-muted-foreground hover:text-foreground'}">
					Rejected
					<span class="rounded border border-border bg-input px-1.5 py-0.5 font-mono text-[10px] text-rose-500"
						>{rejectedCount}</span>
				</button>

				<button
					onclick={() => (mode = 2)}
					class="flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all
                    {mode === 2
						? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
						: 'text-muted-foreground hover:text-foreground'}">
					Approved
					<span class="rounded border border-border bg-input px-1.5 py-0.5 font-mono text-[10px] text-emerald-500"
						>{approvedCount}</span>
				</button>

				<div class="mx-1 h-4 w-px bg-border"></div>

				<button
					onclick={() => (mode = 0)}
					class="flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all
                    {mode === 0
						? 'border border-indigo-500/20 bg-indigo-500/10 text-indigo-400'
						: 'text-muted-foreground hover:text-foreground'}">
					Total
					<span class="rounded border border-border bg-input px-1.5 py-0.5 font-mono text-[10px] text-indigo-400"
						>{totalCount}</span>
				</button>
			</nav>
		</div>

		<div
			class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card/20 backdrop-blur-sm">
			{#if !project.name}
				<div class="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground/60">
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
						class="text-muted-foreground/70">
						<path
							d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" />
					</svg>
					<p class="text-base font-medium tracking-tight text-muted-foreground">
						Select a project from the left queue to review
					</p>
				</div>
			{:else}
				<div class="animate-fadeIn flex min-h-0 w-full flex-1 flex-col">
					<div class="flex shrink-0 items-start justify-between gap-4 border-b border-border bg-card/10 p-6">
						<div class="flex flex-col gap-1.5">
							<div class="flex flex-wrap items-center gap-3">
								<h1 class="text-xl font-bold tracking-tight text-foreground">
									{project.name}
								</h1>
								<span
									class="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400">
									{project.hours} Hours Tracked
								</span>
								<Button
									onclick={() => (detailsOpen = true)}
									variant="outline"
									size="sm"
									class="h-7 border-border bg-card/50 text-xs text-foreground hover:text-primary-foreground">
									Full Details
								</Button>
							</div>
							<p class="flex items-center gap-x-2 divide-x divide-border text-xs text-muted-foreground">
								<span class="pr-2"><strong>Creator:</strong> @{project.submittedBy}</span>
								<span class="pr-2">
									<strong>Type:</strong>
									<span class="capitalize">{project.type}</span>
								</span>
								<span class="pr-2"><strong>Category:</strong> {project.category}</span>
							</p>
						</div>

						<div class="flex items-center gap-2">
							<a
								href={safeHref(project.demo)}
								target="_blank"
								rel="noreferrer noopener"
								class="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted hover:text-primary-foreground"
								>Demo</a>
							<a
								href={safeHref(project.code)}
								target="_blank"
								rel="noreferrer noopener"
								class="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted hover:text-primary-foreground"
								>Repository</a>
							<a
								href={safeHref(project.readme)}
								target="_blank"
								rel="noreferrer noopener"
								class="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted hover:text-primary-foreground"
								>Readme</a>
						</div>
					</div>

					<div class="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
						<div class="custom-scrollbar h-full space-y-5 overflow-y-auto border-r border-border p-6">
							<div class="flex flex-col gap-2">
								<label for="userFeedback" class="text-xs font-bold tracking-wider text-muted-foreground uppercase"
									>User Feedback Message</label>
								<div
									class="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition duration-200
                                    {userExternalCount >= 20
										? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
										: 'border-amber-500/20 bg-amber-500/5 text-amber-400'}">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round">
										<circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
									</svg>
									<span>
										{userExternalCount >= 20
											? "Feedback criteria accepted for execution."
											: `Requires at least 20 characters (${userExternalCount}/20)`}
									</span>
								</div>
								<Textarea
									id="userFeedback"
									class="min-h-[100px] resize-none border-border bg-input text-sm leading-relaxed text-foreground focus:border-transparent focus:ring-1 focus:ring-indigo-500"
									placeholder="Type the user feedback here...."
									bind:value={userExternal} />
							</div>

							<div class="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/40 p-4">
								<div class="flex items-center justify-between gap-4">
									<div class="flex flex-col">
										<!-- svelte-ignore a11y_label_has_associated_control -->
										<label id="override" class="text-xs font-bold tracking-wider text-muted-foreground uppercase"
											>Override Hours</label>
										<p class="text-[11px] text-muted-foreground">Deduct hours from project metrics</p>
									</div>
									<Input
										id="override"
										class="h-9 w-24 border-border bg-input text-center text-foreground focus:ring-1 focus:ring-indigo-500"
										type="number"
										bind:value={overrideHours}
										min="0" />
								</div>
								<div class="mt-1">
									<label for="justification" class="mb-1 block text-[11px] font-semibold text-muted-foreground"
										>Generated Submission Justification</label>
									<Textarea
										id="justification"
										class="min-h-[100px] resize-none border-border bg-input font-mono text-xs leading-relaxed text-muted-foreground"
										readonly
										bind:value={autogenChangelog} />
								</div>
							</div>
						</div>

						<div class="custom-scrollbar h-full space-y-5 overflow-y-auto bg-card/5 p-6">
							<div class="flex flex-col gap-2">
								<label for="internalNote" class="text-xs font-bold tracking-wider text-muted-foreground uppercase"
									>Internal Review Notes <span class="font-normal text-muted-foreground/60 lowercase">(optional)</span
									></label>
								<Textarea
									id="internalNote"
									class="min-h-[90px] resize-none border-border bg-input text-sm leading-relaxed text-foreground focus:border-transparent focus:ring-1 focus:ring-indigo-500"
									placeholder="Internal reviewers' notes."
									bind:value={internalNote} />
							</div>
							<div class="flex flex-col gap-2">
								<h3 class="text-xs font-bold tracking-wider text-muted-foreground uppercase">
									Certification Logs & History
								</h3>
								<div
									class="custom-scrollbar space-y-3 overflow-y-auto rounded-xl border border-border bg-input/40 p-4 wrap-break-word">
									{#if project.log && project.log.length > 0}
										<!-- eslint-disable-next-line svelte/require-each-key -- log entries and their messages have no id -->
										{#each [...project.log].reverse() as entry}
											<!-- eslint-disable-next-line svelte/require-each-key -- log entries and their messages have no id -->
											{#each [...entry.message].reverse() as msg, i}
												<div
													class="border {msg.reviewerName === 'user'
														? 'border-l-amber-500'
														: i === 0 || msg.reviewerName?.includes('APPROVED')
															? entry.status === 1 || msg.reviewerName?.includes('APPROVED')
																? 'border-l-emerald-500'
																: 'border-l-rose-500'
															: 'border-l-rose-500'} space-y-2 rounded-lg border-border/80 bg-card/20 p-3 text-xs">
													<div
														class="flex items-center justify-between border-b border-border pb-1.5 text-[11px] text-muted-foreground">
														<span class="font-bold text-muted-foreground"
															>Reviewer: <span class="font-mono text-indigo-400">@{msg.reviewerName || "staff"}</span
															></span>
														<span>{new Date(msg.timestamp).toLocaleString()}</span>
													</div>
													{#if msg.userExternal}
														<p class="leading-relaxed text-foreground">
															<strong class="mb-0.5 block text-[10px] tracking-wider text-muted-foreground uppercase"
																>Feedback Note:</strong>
															{msg.userExternal}
														</p>
													{/if}
													{#if msg.internalNote}
														<p class="rounded border border-border/20 bg-card/30 p-2 text-muted-foreground italic">
															<strong
																class="mb-0.5 block text-[10px] tracking-wider text-muted-foreground/60 uppercase not-italic"
																>Internal Note:</strong>
															{msg.internalNote}
														</p>
													{/if}
												</div>
											{/each}
										{/each}
									{:else}
										<p class="py-4 text-center text-xs text-muted-foreground/60 italic">No cert history</p>
									{/if}
								</div>
							</div>
						</div>
					</div>

					<div
						class="flex shrink-0 items-center justify-end gap-3 border-t border-border bg-input/60 p-4 backdrop-blur-sm">
						<button
							class="flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold tracking-wider text-primary-foreground uppercase shadow-lg shadow-rose-950/20 transition duration-150 hover:bg-rose-500 active:bg-rose-700 disabled:opacity-40"
							disabled={userExternalCount < 20 || rejectLoader}
							onclick={() => rejectProject(project, userExternal, internalNote, overrideHours)}>
							{#if rejectLoader}
								<div class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-border border-t-primary-foreground">
								</div>
							{/if}
							Reject Submission
						</button>

						<button
							class="flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold tracking-wider text-primary-foreground uppercase shadow-lg shadow-emerald-950/20 transition duration-150 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40"
							disabled={userExternalCount < 20 || acceptLoader}
							onclick={() => acceptProject(project, userExternal, internalNote, overrideHours)}>
							{#if acceptLoader}
								<div class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-border border-t-primary-foreground">
								</div>
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
