<script lang="ts">
	import ProjectDetailsDialog from "$lib/components/projectdetails-dialog.svelte"
	import Button from "$lib/components/ui/button/button.svelte"
	import Input from "$lib/components/ui/input/input.svelte"
	import Textarea from "$lib/components/ui/textarea/textarea.svelte"
	import type { Project, Log, AirtableProject } from "$lib/types"
	let detailsOpen = $state(false)
	let { data } = $props()
	let airtableProjects = data.projects as AirtableProject[]
	let project = $state({} as Project)
	let justificationOpen = $state(false)
	const wasEverApproved = (project: AirtableProject) => {
		//Checks the logs and returns true if there was ever an approved log, that is not sent to airtable (aka not pushed)
		const logs = JSON.parse(project.fields.log || "[]") as Log[]
		return logs.some(log => log.status === 1 && !log.submmitedToHQ)
	}
	let currentProject = $state({} as Project)
	function calculateRecordedTime(log: Log[]): number {
		let totalTime = 0
		for (const entry of log) {
			totalTime += entry.deltaTime
		}
		return totalTime
	}
	const setCurrentProject = (nextProject: AirtableProject) => {
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
		}
		console.log("Current project set to log:", currentProject.log)
	}
	let template = $derived(`The user tracked x hours on x hackatime project
${currentProject.update || currentProject.log.length > 0 ? `This project is an update to an existing project`:`This is the first submission of this project`}
Delta:x hours, Adjustmet: Subtract x hours
{Insert t2 Reviewer description}
Changelog:{changelog written by t2 Reviewer}
There are x git commits and approximately x commits/hr
{Reason for adjustment written by t2 Reviewer}

User written logs
Change log: {insert ship changelog}
Delta:{delta of the changelog}
Approved by:{T1 reviewer name}

...... (Insert more)

Full review log available at link:{insert link here}

Signed by {T2 reviewer}
 `)
</script>

<main class="w-screen h-screen">
	<div class="fixed inset-0 bg-black/20 -z-10"></div>
	<div
		class="relative z-50 p-5 h-full w-full flex items-start justify-start gap-x-5"
	>
		<aside
			class="sidebar w-1/4 h-full rounded-2xl bg-black/20 border-2 overflow-y-auto p-2"
		>
			{#each airtableProjects as project}
				{#if wasEverApproved(project)}
					<button
						onclick={() => setCurrentProject(project)}
						class="project w-full border-b h-20 p-2 hover:bg-background rounded-t-2xl"
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
		<div
			class="w-full max-h-full h-full flex flex-col items-center justify-start gap-y-5"
		>
			<nav class="top-bar flex bg-transparent gap-16 text-white">
				<button
					class="button w-34 bg-yellow-900 flex items-center justify-center py-2 rounded-full"
				>
					Pending (20)
				</button>

				<button
					class="button w-34 bg-red-900 flex items-center justify-center py-2 rounded-full"
				>
					Rejected (5)
				</button>

				<button
					class="button w-34 bg-green-900 flex items-center justify-center py-2 rounded-full"
				>
					Approved (15)
				</button>

				<button
					class="button w-34 bg-blue-900 flex items-center justify-center py-2 rounded-full"
				>
					Total (40)
				</button>
			</nav>
			<div
				class="w-full h-full overflow-y-auto bg-background/40 border-2 rounded-2xl flex flex-col items-center justify-start gap-y-3 p-2"
			>
				<div class="details w-full">
					<div class="top-sect w-full p-1 flex items-center justify-between">
						<div class="text flex flex-col items-start justify-start gap-y-1">
							<div class="flex items-center gap-x-2">
								<h1 class="text-2xl text-admin-text font-bold">
									{currentProject.name}: ({currentProject.hours}hrs)
								</h1>
								<Button
									onclick={() => (detailsOpen = true)}
									class="bg-admin-primary"
								>
									Details
								</Button>
							</div>
							<p class="text-xs text-muted-foreground">
								Submitted by: coolcream, Type: Type, Category: category
							</p>
						</div>
						<div class="links flex items-center justify-center gap-x-5">
							<a
								href={"/"}
								class="hover:scale-104 transition px-2 py-0.5 bg-admin-primary/30 rounded-md cursor-pointer"
								target="_blank"
							>
								Demo
							</a>
							<a
								href={"/"}
								class="hover:scale-104 transition px-2 py-0.5 bg-admin-primary/30 rounded-md cursor-pointer"
								target="_blank"
							>
								Repo
							</a>
							<a
								href={"/"}
								class="hover:scale-104 transition px-2 py-0.5 bg-admin-primary/30 rounded-md cursor-pointer"
								target="_blank"
							>
								Readme
							</a>
						</div>
					</div>
				</div>
				<div class="max-h-full w-full overflow-y-auto flex gap-x-3">
					<div class="flex flex-col gap-y-5 max-h-full w-[50%] p-2">
						<div
							class="flex flex-col items-start justify-start gap-y-2 w-full border-b"
						>
							<h2 class="text-muted-foreground">What is this project about?</h2>
							<Textarea
								class="resize-none h-30 overflow-y-auto	"
								placeholder="Gimme a nice brief description of the project.."
							/>
						</div>
						<div class="flex items-center gap-3 justify-start gap-y-1 w-full">
							<h2 class="text-muted-foreground text-sm">
								How many git commits are there?
							</h2>
							<Input
								type="number"
								class="resize-none h-10 w-40 overflow-y-auto	"
								placeholder="Commits?"
							/>
						</div>
						<div class="flex flex-col items-start justify-start gap-y-1 w-full">
							<h2 class="text-muted-foreground text-sm">
								If this project was submitted before, what are the changes in
								this submission?
							</h2>
							<Textarea
								class="resize-none h-30 overflow-y-auto	"
								placeholder="The changes are..."
							/>
						</div>
						<div
							class="flex flex-col items-start justify-start gap-y-1 w-full mt-2"
						>
							<div class="flex items-center justify-between w-full">
								<h2 class="text-muted-foreground text-lg">
									Override hours (optional)
								</h2>
								<Input class="w-[20%]" type="number" value={2} min="0" />
							</div>
							<Textarea
								class="resize-none overflow-y-auto h-30"
								placeholder="Reason for overriding..."
							/>
						</div>
						<div class="controls flex gap-x-3">
							<Button
								class="bg-red-900 w-[45%]"
								onclick={() => (justificationOpen = true)}
							>
								View Generated Justification
							</Button>
							<Button class="bg-green-900 w-[45%]">Push to Airtable</Button>
						</div>
					</div>

					<div class="flex flex-col gap-y-5 h-full w-[50%]">
						<h2 class="text-muted-foreground">Previous Changelogs</h2>
						<div
							class="previous-changelogs w-full overflow-y-scroll gap-y-4 flex flex-col"
						>
							{#each currentProject.log as log}
								<div class="p-2 border rounded-lg w-full">
									<div class="flex items-center gap-2 justify-between">
										<div class="flex items-center gap-x-1">
											<div
												class="avatar w-6 h-6 rounded-full bg-gray-600"
											></div>
											<div class="text-sm font-bold">Hello</div>
										</div>
										<div class="text-xs bg-green-800 px-2 py-1 rounded">
											Approved
										</div>
									</div>
									<p class="feedback text-xs text-gray-300 user-not mt-2">
										{log.message.at(-1)?.userExternal}
									</p>
									<p
										class="notes whitespace-pre-wrap text-xs text-gray-500 overrideJustification"
									>
										{log.message.at(-1)?.internalNote} <br />
										{log.message.at(-1)?.justification}
									</p>
								</div>
							{/each}
						</div>
					</div>
				</div>
				<!-- <div class="w-full flex flex-col gap-y-2 p-2">
					<h2 class="text-muted-foreground text-sm">
						Autogenerated justification:
					</h2>
					<Textarea
						class="resize-none overflow-y-auto h-24"
						readonly
						value="This project is about....There are ___ commits.....The commits are detailed....20 minuted were cut...."
					/>
				</div> -->
			</div>
		</div>
	</div>
</main>

<ProjectDetailsDialog bind:open={detailsOpen} {project} />
{#if justificationOpen}
	<div
		class="generatedJustificationOverlay w-screen h-screen absolute top-0 bg-black/80 z-50 flex items-center justify-center"
	>
		<div class="w-1/2 h-1/2 bg-background rounded-lg p-5 flex flex-col gap-y-5">
			<h1 class="text-xl font-bold">Generated Justification</h1>
			<Textarea
				class="resize-none overflow-y-auto h-full"
				readonly
				value="This project is about....There are ___ commits.....The commits are detailed....20 minuted were cut...."
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
