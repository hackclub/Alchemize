<script lang="ts">
	import { TriangleAlert } from "lucide-svelte"
	import ProjectDialog from "$lib/components/project-dialog.svelte"
	import { formatHours, getHackatimeProjects } from "$lib/utils"
	import type {AirtableProject} from "$lib/types"
	let projectBeingUpdated: AirtableProject | null = $state(null)
	let { data } = $props()
	let newProjWindowOpened = $state(false)
	let updateProjWindowOpened = $state(false)
	type HackatimeProject = {
		name?: string
		project_name?: string
		project?: string
		total_seconds?: number
	}
	
	let projects: AirtableProject[] = $derived(data?.projects ?? [])

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
				(hack.name ?? "").trim().toLowerCase(),
				hack.total_seconds ?? 0,
			])
		)
	)

	function openUpdateProjWindow(project: AirtableProject) {
		projectBeingUpdated = project
		updateProjWindowOpened = true
	}

	let showRotator = $state(false)

	async function shipProject() {
		const project = projectBeingUpdated
		showRotator = true
		if (project == null) {
			showRotator = false
			return
		}
		const response = await fetch("/dashboard/projects/ship", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				recordId: project.id,
			}),
			credentials: "include",
		})
		alert(
			response.ok
				? "Project shipped successfully!"
				: `Error shipping project. Code: ${response.status} — contact @TheUtkarsh8939 on Slack`
		)
		console.log("Ship response:", await response.text())
		showRotator = false
	}
</script>

<main class="bg-gradbg h-screen w-screen flex flex-col items-center">
	<div class="fixed inset-0 bg-black/60 z-10"></div>
	<div
		class="relative h-full w-full flex flex-col items-center z-50 justify-center text-foreground gap-10 p-5"
	>
		<h1 class="text-4xl">Projects</h1>

		<div
			class="border-dashed border-chart-5 border-2 rounded-lg flex items-center justify-center bg-black/10 p-10 flex-col"
		>
			<div class="flex font-semibold text-chart-5 text-2xl gap-2">
				<TriangleAlert />
				<h1>Warning:</h1>
			</div>
			<p class="font-medium">
				This is a work in progress! The hackatime start date is set to an
				obscenely long future date so any projects will show as 0hr
			</p>
		</div>

		<div class="flex items-start justify-start w-full h-full gap-5">
			<button
				class="cursor-pointer"
				onclick={() => (newProjWindowOpened = true)}
			>
				<div
					class="w-48 h-48 border-red-500 border-dashed border flex flex-col items-center justify-center gap-3 rounded-lg hover:bg-red-950/20 transition-colors"
				>
					<i class="fa-solid fa-plus text-4xl"></i>
					<h2 class="text-xl alchemizefont text-chart-5">New Project</h2>
					<h2 class="text-md alchemizefont font-bold">WIP</h2>
				</div>
			</button>

			{#each projects as project}
				<button onclick={() => openUpdateProjWindow(project)}>
					<div
						class="border-red-500 border-dashed border flex flex-col items-center justify-center gap-5 rounded-lg w-48 h-48 hover:bg-red-950/20 transition-colors"
					>
						<span class="text-4xl alchemizefont text-chart-5 font-medium"
							>{project.fields.Name}</span
						>
						<span class="text-lg">
							{formatHours(
								hackSecondsByName.get(
									project.fields.hackatime.trim().toLowerCase()
								)
							)}
						</span>
					</div>
				</button>
			{/each}
		</div>
	</div>
</main>

<ProjectDialog bind:open={newProjWindowOpened} mode="create" {availableHacks} />

<ProjectDialog
	bind:open={updateProjWindowOpened}
	mode="update"
	project={projectBeingUpdated}
	{availableHacks}
	onship={shipProject}
	{showRotator}
/>
