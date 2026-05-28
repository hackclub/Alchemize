<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte"
	import Input from "$lib/components/ui/input/input.svelte"
	import Textarea from "$lib/components/ui/textarea/textarea.svelte"
	import ProjectDetailsDialog from "$lib/components/projectdetails-dialog.svelte"
	import { invalidateAll } from "$app/navigation"
	import type { Project, AirtableProject, Log } from "$lib/types"
	let { data } = $props()
	console.log(data)
	let detailsOpen = $state(false)
	let projects = $derived(data?.projects ?? [])
	console.log(projects)

	let project = $state({} as Project)
	function calculateRecordedTime(log: Log[]): number {
		let totalTime = 0
		for (const entry of log) {
			totalTime += entry.deltaTime
		}
		return totalTime
	}
	const openProject = (projectId: string) => {
		invalidateAll()
		const nextProject = projects.find(
			(item: AirtableProject) => item.id === projectId
		)
		if (nextProject) {
			project = {
				name: nextProject.fields.Name,
				hours: calculateRecordedTime(
					JSON.parse(nextProject.fields.log ?? "[]") as Log[]
				),
				submittedBy: nextProject.fields.slackId,
				type: nextProject.fields.type,
				category: nextProject.fields.Theme,
				description: nextProject.fields.description,
				log: JSON.parse(nextProject.fields.log ?? "[]"),
				demo: nextProject.fields.demo,
				code: nextProject.fields.code,
				readme: nextProject.fields.code,
			} as Project
		}
		console.log(project)
	}
	let mode = $state(0) // 0 = all, 1 = pending, 2 = approved, 3 = rejected
	let filterProjectByMode = (project: AirtableProject) => {
		if (project.fields.status.startsWith("pending") && mode === 1) return true
		if (project.fields.status.startsWith("approved") && mode === 2) return true
		if (project.fields.status.startsWith("rejected") && mode === 3) return true
		if (mode === 0) return true
	}
	// let project = null
</script>

<main class="w-screen h-screen">
	<div class="fixed inset-0 bg-black/20 -z-10"></div>
	<div
		class="relative z-50 p-5 h-full w-full flex items-start justify-start gap-x-5"
	>
		<aside
			class="sidebar w-1/4 h-full rounded-2xl bg-black/20 border-2 overflow-y-auto p-2"
		>
			{#each projects as project}
				{#if filterProjectByMode(project)}
					<button
						class="project w-full border-b h-20 p-2 hover:bg-background rounded-t-2xl"
						onclick={() => openProject(project.id)}
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
				{/if}
			{/each}
		</aside>
		<div class="w-full h-full flex flex-col items-center justify-start gap-y-5">
			<nav class="top-bar flex bg-transparent gap-16 text-white">
				<button
					onclick={() => (mode = 1)}
					class="button w-34 bg-yellow-900 flex items-center justify-center py-2 rounded-full"
				>
					Pending (20)
				</button>

				<button
					onclick={() => (mode = 2)}
					class="button w-34 bg-red-900 flex items-center justify-center py-2 rounded-full"
				>
					Rejected (5)
				</button>

				<button
					onclick={() => (mode = 2)}
					class="button w-34 bg-green-900 flex items-center justify-center py-2 rounded-full"
				>
					Approved (15)
				</button>

				<button
					onclick={() => (mode = 0)}
					class="button w-34 bg-blue-900 flex items-center justify-center py-2 rounded-full"
				>
					Total (40)
				</button>
			</nav>
			<div
				class="w-full h-full bg-background/40 border-2 rounded-2xl flex flex-col items-center justify-start gap-y-3 p-2"
			>
				{#if !project.name}
					<div
						class="w-full h-full flex items-center justify-center text-blue-900 font-bold font-alchemize text-4xl"
					>
						Open a project to review it!
					</div>
				{/if}
				{#if project.name}
					<div class="details w-full">
						<div class="top-sect w-full p-1 flex items-center justify-between">
							<div class="text flex flex-col items-start justify-start gap-y-1">
								<div class="flex items-center gap-x-2">
									<h1 class="text-2xl text-admin-text font-bold">
										{project.name}: ({project.hours} hours)
									</h1>
									<Button onclick={() => (detailsOpen = true)}>Details</Button>
								</div>
								<p class="text-xs text-muted-foreground">
									Submitted by: {project.submittedBy}, Type: {project.type},
									Category: {project.category}
								</p>
							</div>
							<div class="links flex items-center justify-center gap-x-5">
								<a
									href={project.demo}
									class="hover:scale-104 transition px-2 py-0.5 bg-admin-primary/30 rounded-md cursor-pointer"
									target="_blank"
								>
									Demo
								</a>
								<a
									href={project.code}
									class="hover:scale-104 transition px-2 py-0.5 bg-admin-primary/30 rounded-md cursor-pointer"
									target="_blank"
								>
									Repo
								</a>
								<a
									href={project.readme}
									class="hover:scale-104 transition px-2 py-0.5 bg-admin-primary/30 rounded-md cursor-pointer"
									target="_blank"
								>
									Readme
								</a>
							</div>
						</div>
						<div
							class="flex items-center justify-between gap-x-5 w-full h-full mt-1"
						>
							<div
								class="form-fields h-full w-[50%] flex flex-col items-start justify-start gap-y-2 mt-2"
							>
								<div
									class="flex flex-col items-start justify-start gap-y-1 w-full"
								>
									<h2 class="text-muted-foreground">Decision:</h2>
									<Textarea
										class="resize-none h-12"
										placeholder="User Feedback"
									/>
								</div>
								<div
									class="flex flex-col items-start justify-start gap-y-1 w-full"
								>
									<h2 class="text-muted-foreground">
										Internal notes (optional)
									</h2>
									<Textarea
										class="resize-none h-12"
										placeholder="Internal reviewer notes..."
									/>
								</div>
								<div
									class="flex flex-col items-start justify-start gap-y-1 w-full mt-2"
								>
									<div class="flex items-center justify-between w-full">
										<h2 class="text-muted-foreground text-lg">
											Justification:
										</h2>
										<Input class="w-[20%]" type="number" defaultValue="4" />
									</div>
									<Textarea
										class=" h-36"
										placeholder="Justification for Approval (Mandatory)"
									/>
								</div>
								<div class="buttons grid grid-cols-2 gap-x-3 w-full mt-3">
									<button
										class="py-1 px-2 text-lg hover:scale-102 rounded-md bg-green-800"
									>
										Approve
									</button>
									<button
										class="py-1 px-2 text-lg hover:scale-102 rounded-md bg-rose-800"
									>
										Reject
									</button>
								</div>
							</div>
							<div
								class="notes h-full w-[50%] flex flex-col items-start justify-start gap-y-5 mt-2"
							>
								<div
									class="flex flex-col items-start justify-start gap-y-1 w-full"
								>
									<h2 class="text-muted-foreground">Reviewer notes</h2>
									<Textarea
										class="resize-none h-24"
										readonly
										placeholder="This project is a different one i will do it. -coolcream"
									/>
								</div>

								<div
									class="flex flex-col items-start justify-start gap-y-1 w-full"
								>
									<h2 class="text-muted-foreground">Certification History</h2>
									<div
										class="p-2 border rounded-lg space-y-3 max-w-full overflow-y-auto"
									>
										<div class="p-2 border rounded-lg">
											<div class="flex items-center gap-2 justify-between">
												<div class="flex items-center gap-x-1">
													<div
														class="avatar w-6 h-6 rounded-full bg-gray-600"
													></div>
													<div class="text-sm font-bold">Admin User</div>
												</div>
												<div class="text-xs bg-green-800 px-2 py-1 rounded">
													Approved
												</div>
											</div>
											<p class="feedback text-xs text-gray-300 user-not mt-2">
												Great project! Loved the creativity and execution.
											</p>
											<p
												class="notes text-xs text-gray-500 overrideJustification"
											>
												Lorem ipsum dolor sit amet, consectetur adipiscing elit.
												Donec vel justo eget felis facilisis fermentum. Donec
												congue lacinia dui, lorem ipsum dolor sit amet
											</p>
										</div>
										<div class="p-2 border rounded-lg">
											<div class="flex items-center gap-2 justify-between">
												<div class="flex items-center gap-x-1">
													<div
														class="avatar w-6 h-6 rounded-full bg-gray-600"
													></div>
													<div class="text-sm font-bold">Admin User 2</div>
												</div>
												<div class="text-xs bg-red-800 px-2 py-1 rounded">
													Rejected
												</div>
											</div>
											<p class="feedback text-xs text-gray-300 user-not mt-2">
												Doesnt work. Please fix it.
											</p>
											<p
												class="notes text-xs text-gray-500 overrideJustification"
											>
												Lorem ipsum dolor sit amet, consectetur adipiscing elit.
												Donec vel justo eget felis facilisis fermentum. Donec
												congue lacinia dui, lorem ipsum dolor sit amet
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</main>

<ProjectDetailsDialog bind:open={detailsOpen} {project} />
