<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte"
	import ProjectDialog from "$lib/components/project-dialog.svelte"

	import { Plus, Clock, Image, ArrowUpRight, Blocks } from "lucide-svelte"

	import { invalidateAll } from "$app/navigation"
	import { loaderStore } from "$lib/stores/loader"

	import { formatHours, getHackatimeProjects } from "$lib/utils"
	import { toast } from "svelte-sonner"
	import type { AirtableProject } from "$lib/types"

	let { data } = $props()

	type HackatimeProject = {
		name?: string
		project_name?: string
		project?: string
		total_seconds?: number
	}

	let projects: AirtableProject[] = $state(data?.projects ?? [])

	$effect(() => {
		projects = data?.projects ?? []
	})

	let projectBeingUpdated: AirtableProject | null = $state(null)

	let newProjWindowOpened = $state(false)
	let updateProjWindowOpened = $state(false)

	let showRotator = $state(false)

	let hacks: HackatimeProject[] = $derived(getHackatimeProjects(data?.hacks))

	let usedHackatimes = $derived(
		new Set(
			projects
				.flatMap(project => project.fields.hackatime?.split(",") ?? [])
				.map(name => name.trim().toLowerCase())
				.filter(Boolean)
		)
	)

	let availableHacks = $derived(
		hacks.filter(hack => {
			const hackName = (hack.name ?? hack.project_name ?? hack.project ?? "")
				.trim()
				.toLowerCase()

			return Boolean(hackName) && !usedHackatimes.has(hackName)
		})
	)

	let hackSecondsByName = $derived(
		new Map(
			hacks.map(hack => [
				(hack.name ?? hack.project_name ?? hack.project ?? "")
					.trim()
					.toLowerCase(),
				hack.total_seconds ?? 0,
			])
		)
	)

	function openUpdateProjWindow(project: AirtableProject) {
		projectBeingUpdated = project
		updateProjWindowOpened = true
	}

	function applyBadge(project: AirtableProject) {
		const status = project.fields.status?.toLowerCase() ?? ""
		if (status.startsWith("pending")) {
			return {
				dot: "bg-amber-500",
				text: "text-amber-400",
				title: "pending",
			}
		}
		if (status.startsWith("rejected")) {
			return {
				dot: "bg-red-500",
				text: "text-red-400",
				title: "changes needed",
			}
		}
		if (status.startsWith("accepted")) {
			return {
				dot: "bg-emerald-500",
				text: "text-emerald-400",
				title: "approved",
			}
		}
		return {
			dot: "bg-blue-500",
			text: "text-blue-400",
			title: "unshipped",
		}
	}

	async function invalidater() {
		loaderStore.set(true)
		try {
			await invalidateAll()
		} finally {
			loaderStore.set(false)
		}
	}

	async function shipProject(changelog: string) {
		if (changelog.trim().length < 20) {
			toast.error("Please provide a changelog before shipping.")
			return
		}

		const project = projectBeingUpdated
		if (!project) return

		showRotator = true

		try {
			const response = await fetch("/dashboard/projects/ship", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					recordId: project.id,
					changelog,
				}),
				credentials: "include",
			})

			toast(
				response.ok
					? "Project shipped successfully!"
					: `Error shipping project. Code: ${response.status} — contact @TheUtkarsh8939 on Slack`
			)

			const responseData = await response.json()

			if (projectBeingUpdated) {
				const updatedProject = {
					...projectBeingUpdated,
					fields: {
						...projectBeingUpdated.fields,
						...(responseData.newLog
							? { log: JSON.stringify(responseData.newLog) }
							: {}),
						...(responseData.newStatus
							? { status: responseData.newStatus }
							: {}),
					},
				}

				projectBeingUpdated = updatedProject
				projects = projects.map(p =>
					p.id === updatedProject.id ? updatedProject : p
				)
			}

			await invalidateAll()
		} finally {
			showRotator = false
		}
	}
</script>

<main
	class="min-h-screen w-full bg-gradbg text-foreground p-6 md:p-10 font-mono tracking-wide selection:bg-primary selection:text-primary-foreground"
>
	<div class="fixed inset-0 bg-black/40 pointer-events-none"></div>

	<div class="relative z-50 max-w-7xl mx-auto flex flex-col gap-8">
		<div
			class="flex items-center justify-between border-b-2 border-primary/30 pb-4"
		>
			<div class="flex items-center gap-3">
				<Blocks class="h-4 w-4 animate-pulse text-primary" />
				<h1
					class="text-2xl font-alchemize font-black uppercase tracking-wider text-primary"
				>
					Your Mixes
					<span class="text-[0.5rem] text-white">Alchemize</span>
				</h1>
			</div>

			<Button
				size="sm"
				variant="outline"
				class="border-2 border-primary bg-background text-primary hover:bg-primary hover:text-primary-foreground font-bold tracking-wider uppercase rounded-none transition-all duration-100 shadow-[2px_2px_0px_0px_rgba(var(--primary),0.3)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none mr-10"
				onclick={() => (newProjWindowOpened = true)}
			>
				<Plus class="size-4 mr-1 stroke-3" />
				<span>New Mix</span>
			</Button>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
			{#each projects as project}
				<div class="relative group">
					<div
						class="absolute inset-0 bg-primary/80 translate-x-[6px] translate-y-[6px] rounded-sm transition-transform group-hover:translate-x-[4px] group-hover:translate-y-[4px]"
					></div>

					<button
						class="relative w-full text-left flex flex-col bg-black/95 border-2 border-primary/90 rounded-sm overflow-hidden h-[190px] p-4 transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[4px] active:translate-y-[4px] focus:outline-none focus:ring-1 focus:ring-primary"
						onclick={() => openUpdateProjWindow(project)}
					>
						{#if project.fields.screenshot}
							<div
								class="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-45 group-hover:opacity-65 transition-opacity duration-200"
							>
								<img
									src={project.fields.screenshot}
									alt=""
									class="w-full h-full object-cover scale-100 group-hover:scale-[1.03] transition-transform duration-300"
								/>
								<div
									class="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-black/75"
								></div>
							</div>
						{/if}

						<div
							class="relative z-10 w-full h-full flex flex-col justify-between"
						>
							<div
								class="flex flex-col items-start justify-start gap-y-2 w-full h-full"
							>
								<div class="w-full flex items-center justify-between gap-4">
									<h2
										class="text-2xl font-black tracking-tight text-white line-clamp-1 [text-shadow:0_2px_4px_rgba(0,0,0,0.8)] font-alchemize"
									>
										{project.fields.Name || "Untitled Mix"}
									</h2>

									<span
										class="text-xs font-bold text-zinc-300 px-2 py-0.5 border-zinc-800 rounded-none flex items-center gap-1.5 shrink-0 shadow-md"
									>
										<Clock class="size-4 text-primary" />
										{formatHours(
											hackSecondsByName.get(
												(project.fields.hackatime ?? "").trim().toLowerCase()
											) ?? 0
										)}
									</span>
								</div>

								<p
									class="text-zinc-200 text-sm leading-relaxed line-clamp-3 font-sans tracking-normal max-w-[92%] [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]"
								>
									{project.fields.description || "No description for this mix."}
								</p>
							</div>

							<div class="flex items-center justify-between p-0">
								<div class="flex items-center gap-2">
									<span
										class={`h-2 w-2 rounded-full ${applyBadge(project).dot}`}
									></span>
									<span
										class={`text-[11px] uppercase font-extrabold tracking-widest [text-shadow:0_1px_2px_rgba(0,0,0,0.6)] ${applyBadge(project).text}`}
									>
										{applyBadge(project).title}
									</span>
								</div>

								<div
									class="flex items-center justify-end w-full text-zinc-300 group-hover:text-primary transition-colors text-[11px] font-bold uppercase tracking-wider gap-0.5 [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]"
								>
									<ArrowUpRight class="size-3.5 opacity-80" />
									<span>To View</span>
								</div>
							</div>
						</div>
					</button>
				</div>
			{/each}

			<div class="relative group">
				<div
					class="absolute inset-0 bg-zinc-800/80 translate-x-[6px] translate-y-[6px] rounded-sm transition-transform group-hover:translate-x-[4px] group-hover:translate-y-[4px]"
				></div>

				<button
					class="relative w-full flex flex-col items-center justify-center bg-black/90 border-2 border-dashed border-zinc-700 hover:border-primary/80 rounded-sm h-[190px] p-6 text-center transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[4px] active:translate-y-[4px] focus:outline-none"
					onclick={() => (newProjWindowOpened = true)}
				>
					<div class="flex flex-col items-center justify-center gap-3">
						<div
							class="p-2.5 bg-zinc-900 border border-zinc-800 rounded-none group-hover:border-primary/40 group-hover:bg-primary/5 transition-colors"
						>
							<Plus
								class="size-5 text-zinc-500 group-hover:text-primary transition-colors stroke-[2.5]"
							/>
						</div>
						<div>
							<span
								class="block text-sm font-black uppercase tracking-widest text-zinc-300 group-hover:text-white transition-colors"
							>
								Add Mix
							</span>
							<span class="block text-[11px] text-zinc-500 mt-0.5">
								Initialize a fresh project
							</span>
						</div>
					</div>

					<div
						class="absolute bottom-4 right-4 flex items-center text-zinc-600 group-hover:text-primary transition-colors text-[11px] font-bold uppercase tracking-wider gap-0.5"
					>
						<Plus class="size-3.5" />
						<span>To Create</span>
					</div>
				</button>
			</div>
		</div>
	</div>
</main>

<ProjectDialog
	bind:open={newProjWindowOpened}
	mode="create"
	{availableHacks}
	{invalidater}
	onship={() => {}}
/>

<ProjectDialog
	bind:open={updateProjWindowOpened}
	mode="update"
	project={projectBeingUpdated}
	{availableHacks}
	onship={shipProject}
	{showRotator}
	{invalidater}
/>
