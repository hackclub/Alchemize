<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte"
	import ProjectDialog from "$lib/components/project-dialog.svelte"

	import { Plus } from "lucide-svelte"

	import { invalidateAll } from "$app/navigation"
	import { loaderStore } from "$lib/stores/loader"

	import { formatHours, getHackatimeProjects } from "$lib/utils"

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
		if (project.fields.status.startsWith("pending")) {
			return {
				class: "bg-amber-800 border-l border-l-amber-500 text-white",
				title: "Pending",
			}
		}

		if (project.fields.status.startsWith("rejected")) {
			return {
				class: "bg-red-800 border-l border-l-red-500 text-white",
				title: "Changes Needed",
			}
		}

		if (project.fields.status.startsWith("accepted")) {
			return {
				class: "bg-green-800 border-l border-l-green-500 text-white",
				title: "Approved",
			}
		}

		if (project.fields.status.startsWith("unshipped")) {
			return {
				class: "bg-blue-800 border-l border-l-blue-500 text-white",
				title: "Unshipped",
			}
		}

		return {
			class: "bg-blue-800 border-l border-l-blue-500 text-white",
			title: "Unshipped",
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
			alert("Please provide a changelog before shipping.")
			return
		}

		const project = projectBeingUpdated

		if (!project) {
			return
		}

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

			alert(
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
							? {
									log: JSON.stringify(responseData.newLog),
								}
							: {}),
						...(responseData.newStatus
							? {
									status: responseData.newStatus,
								}
							: {}),
					},
				}

				projectBeingUpdated = updatedProject

				projects = projects.map(project =>
					project.id === updatedProject.id ? updatedProject : project
				)
			}

			await invalidateAll()
		} finally {
			showRotator = false
		}
	}
</script>

<main class="bg-gradbg h-screen w-screen flex flex-col items-center">
	<div class="fixed inset-0 bg-black/60 z-10"></div>

	<div
		class="relative h-full w-full flex flex-col items-center z-50 text-foreground gap-10 p-5 pt-[9%]"
	>
		<div class="h-[90%] w-[80%] flex flex-col items-center justify-start">
			<div
				class="flex items-center justify-between bg-primary/60 p-3 w-full rounded-t-2xl"
			>
				<div class="flex items-center gap-x-2">
					<img src="/Alchemize.png" alt="alch" class="h-14 object-contain" />

					<div>
						<h1 class="text-lg font-alchemize font-semibold">
							Alchemize Projects
						</h1>

						<h2 class="text-xs font-light font-mono">Manage your projects</h2>
					</div>
				</div>

				<Button
					class="h-full px-8 hover:scale-103 transition-transform"
					onclick={() => (newProjWindowOpened = true)}
				>
					<Plus />
					<p class="text-lg">New Project</p>
				</Button>
			</div>

			<div
				class="h-full max-h-full w-full border-primary border-2 border-t-0 rounded-b-2xl p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-start justify-start"
			>
				{#each projects as project}
					<button
						class="text-left"
						onclick={() => openUpdateProjWindow(project)}
					>
						<div
							class=" rounded-xl border border-primary/60 bg-primary/5 hover:bg-primary/10 transition-colors p-4 flex flex-col justify-between"
						>
							<div class="flex items-center justify-between">
								<h2
									class="font-alchemize text-2xl font-semibold text-chart-5 wrap-break-word line-clamp-2"
								>
									{project.fields.Name}
								</h2>

								<p class="text-xs text-muted-foreground font-mono">
									{project.fields.hackatime}
								</p>
							</div>

							<div class="flex flex-col gap-3 mt-5">
								<div>
									<p class="text-xs uppercase opacity-70">Time Tracked</p>

									<p class="text-2xl font-mono">
										{formatHours(
											hackSecondsByName.get(
												project.fields.hackatime.trim().toLowerCase()
											)
										)}
									</p>
								</div>

								<div
									class={`px-3 py-1 rounded-full text-xs font-medium w-fit ${applyBadge(project).class}`}
								>
									{applyBadge(project).title}
								</div>
							</div>
						</div>
					</button>
				{/each}

				{#if projects.length === 0}
					<div
						class="col-span-full flex items-center justify-center h-64 text-muted-foreground"
					>
						No projects yet. Create your first project.
					</div>
				{/if}
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
