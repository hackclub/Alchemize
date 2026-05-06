<script lang="ts">
	import { TriangleAlert } from "lucide-svelte"

	interface Project {
		id: string
		createdTime: string
		fields: {
			Name: string
			description: string
			code?: string
			demo?: string
			type: string
			update?: boolean
			hackatime: string
			journals: ""
			languages: ""
			log: ""
			owner: string
			status: string
		}
	}
	let projectBeingUpdated: Project | null = $state(null)
	let { data } = $props()
	let newProjWindowOpened = $state(false)
	let updateProjWindowOpened = $state(false)
	console.log(data?.projects)

	const openNewProjWindow = () => {
		newProjWindowOpened = true
		console.log("Opening New Project Window")
	}

	const closeNewProjWindow = () => {
		newProjWindowOpened = false
	}
	const closeUpdateProjWindow = () => {
		updateProjWindowOpened = false
	}
	let styleNewProjWindow = $derived(newProjWindowOpened ? "flex" : "none")
	let styleUpdateProjWindow = $derived(updateProjWindowOpened ? "flex" : "none")
	let projects: Project[] = $derived(data?.projects ?? [])
	type HackatimeProject = {
		name?: string
		project_name?: string
		project?: string
		total_seconds?: number
	}

	function getHackatimeProjects(payload: unknown): HackatimeProject[] {
		if (!payload || typeof payload !== "object") {
			return []
		}

		const maybeProjects = (payload as { projects?: unknown }).projects
		return Array.isArray(maybeProjects)
			? (maybeProjects as HackatimeProject[])
			: []
	}

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

	function formatHours(totalSeconds: number | undefined): string {
		const hours = (totalSeconds ?? 0) / 3600
		return `${hours.toFixed(1)}hr`
	}
	function openUpdateProjWindow(project: Project) {
		projectBeingUpdated = project
		updateProjWindowOpened = true
	}
	let showRotator = $state(false)
	async function shipProject(project: Project | null) {
		showRotator = true
		if (project == null) return
		const projectHackatimeNames = project.fields.hackatime
		const hackatimeSeconds = hackSecondsByName.get(
			projectHackatimeNames.trim().toLowerCase()
		)
		if (hackatimeSeconds === undefined) {
			alert(
				"Error: The Hackatime project associated with this project was not found. Please make sure the Hackatime project name is correct."
			)
			return
		}
		const hackatimeMins = Math.floor(hackatimeSeconds / 60)
		const recordId = project.id
		const log = project.fields.log
		const response = await fetch("/dashboard/projects/ship", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: `{
  					"log":"${log}",
  					"hackatime":${hackatimeMins},
  					"recordId":"${recordId}"
				}`,
			credentials: "include",
		})
		if (response.ok) {
			alert("Project shipped successfully!")
			showRotator = false
		} else {
			alert(
				"Error shipping project. Error Code: " +
					response.status +
					" Please Contact TheUtkarsh8939 on Slack"
			)
			showRotator = false
		}
	}
</script>

<main
	class="bg-background h-screen w-screen flex flex-col items-center justify-center text-foreground gap-10 p-5"
>
	<h1 class="text-4xl">Projects</h1>
	<div
		class="warning border-dashed border-chart-5 border-2 rounded-lg flex items-center justify-center bg-black/10 p-10 flex-col"
	>
		<div class="flex font-semibold text-chart-5 text-2xl">
			<TriangleAlert />
			<h1>Warning:</h1>
		</div>
		<p class="font-medium">
			This is a work in progress! The hackatime start date is set to an
			obscenely long future date so any projects will show as 0hr
		</p>
	</div>
	<div class="flex items-start justify-start w-full h-full gap-5">
		<div class="projects">
			<button class="proj-btn cursor-pointer" onclick={openNewProjWindow}>
				<div
					class="new-proj w-48 h-48 border-red-500 border-dashed border flex flex-col items-center justify-center gap-3 rounded-lg"
				>
					<i class="fa-solid fa-plus text-4xl"></i>
					<h2 class="text-xl alchemizefont text-chart-5">New Project</h2>
					<h2 class="text-md alchemizefont font-bold">WIP</h2>
				</div>
			</button>
		</div>
		{#each projects as project}
			<button onclick={() => openUpdateProjWindow(project)}>
				<div
					class="new-proj border-red-500 border-dashed border flex flex-col items-center justify-center gap-5 rounded-lg w-48 h-48"
				>
					<span class="text-4xl alchemizefont text-chart-5 font-medium"
						>{project.fields.Name}</span
					>

					<span class="text-lg hours">
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
</main>
<div
	class="newProjectOvr h-screen w-screen items-center justify-center absolute"
	id="newProjectOvr"
	style="display: {styleNewProjWindow};"
>
	<div
		class="relative newProjectForm h-1/2 w-3/5 bg-black pt-5 border-red-500 border-2 border-dashed flex items-center rounded-lg flex-col"
	>
		<button
			class="cutButton absolute top-5 right-5 cursor-pointer"
			aria-label="Cut"
			onclick={closeNewProjWindow}
		>
			<i class="fa-solid fa-times"></i>
		</button>
		<h1 class="text-3xl mb-5 w-full pl-10">Create New Project</h1>
		<form
			method="POST"
			class="w-full flex-1 flex flex-col form justify-start gap-5 px-10 overflow-y-auto pb-20"
			action="?/create"
		>
			<div>
				<span>Project Name:</span> <br />
				<input
					type="text"
					id="name"
					name="name"
					required
					placeholder="Project Name"
					class="w-full input"
				/>
			</div>
			<div>
				<span>Project Description:</span> <br />

				<textarea
					id="description"
					name="description"
					required
					placeholder="Project Description(Markdown Allowed)"
					class="w-full h-50 input"
				></textarea>
			</div>

			<div>
				<label for="github">GitHub Repository URL</label> <br />
				<input
					type="url"
					id="github"
					name="github"
					placeholder="https://github.com/user/repo"
					class="input"
				/>
			</div>

			<div>
				<label for="demo">Demo URL:</label>
				<input
					type="url"
					id="demo"
					name="demo"
					placeholder="https://example.com/demo"
					class="input"
				/>
			</div>
			<div>
				<label for="type">Type:</label>
				<select name="type" id="type" class="input">
					<option value="web">Web Playable</option>
					<option value="mobile">Mobile App</option>
					<option value="desktop">Desktop App</option>
					<option value="terminal">Terminal App</option>
					<option value="hardware">Hardware</option>
				</select>
			</div>
			<div>
				<label for="theme">Theme:</label>
				<select name="theme" id="theme" class="input">
					<option value="Sci-fi">Sci-Fi</option>
					<option value="anime">Anime</option>
					<option value="tribute">Tribute</option>
				</select>
			</div>
			<div>
				<label for="type">Hackatime:</label>
				<select name="hackatime" id="hackatime" class="input">
					{#each availableHacks as hack}
						<option value={hack.name}>
							{hack.name}
						</option>
					{/each}
				</select>
			</div>
			<div class="flex justify-start items-center gap-5">
				<input
					type="checkbox"
					id="projectUpdate"
					name="projectUpdate"
					class=""
				/>
				<label for="projectUpdate"
					>My project is an update <br /> Tick this if your project started before
					June</label
				>
			</div>
			<button
				type="submit"
				class="w-40 border-red-500 border-dotted h-10 border-2 p-2 text-lg flex items-center justify-center cursor-pointer rounded-lg"
				>Create Project</button
			>
		</form>
	</div>
</div>
<div
	class="newProjectOvr h-screen w-screen items-center justify-center absolute"
	id="newProjectOvr"
	style="display: {styleUpdateProjWindow};"
>
	<div
		class="relative newProjectForm h-1/2 w-3/5 bg-black pt-5 border-red-500 border-2 border-dashed flex items-center rounded-lg flex-col"
	>
		<button
			class="cutButton absolute top-5 right-5 cursor-pointer"
			aria-label="Cut"
			onclick={closeUpdateProjWindow}
		>
			<i class="fa-solid fa-times"></i>
		</button>
		<h1
			class="text-3xl mb-5 w-full pl-10 flex items-center justify-between px-10"
		>
			Update {projectBeingUpdated?.fields.Name}:{formatHours(
				hackSecondsByName.get(
					projectBeingUpdated?.fields.hackatime.trim().toLowerCase() as string
				)
			)}
			<button
				class="ship border-orange-700 border border-dotted p-3 rounded-2xl cursor-pointer flex gap-5 items-center"
				onclick={() => shipProject(projectBeingUpdated)}
			>
				<i class="fa-solid fa-ship"></i>
				{#if showRotator}
					<div
						class="w-7 h-7 border-4 border-gray-600 border-t-white rounded-full animate-spin"
					></div>
				{/if}

				Ship
			</button>
		</h1>
		<form
			method="POST"
			class="w-full flex-1 flex flex-col form justify-start gap-5 px-10 overflow-y-auto pb-20"
			action="?/update"
		>
			<input
				type="text"
				class="hidden"
				id="recordId"
				name="recordId"
				value={projectBeingUpdated?.id}
			/>

			<div>
				<span>Project Name:</span> <br />
				<input
					type="text"
					id="name"
					name="name"
					required
					placeholder="Project Name"
					class="w-full input"
					value={projectBeingUpdated?.fields.Name}
				/>
			</div>
			<div>
				<span>Project Description:</span> <br />

				<textarea
					id="description"
					name="description"
					required
					placeholder="Project Description(Markdown Allowed)"
					class="w-full h-50 input"
					value={projectBeingUpdated?.fields.description}
				></textarea>
			</div>

			<div>
				<label for="github">GitHub Repository URL</label> <br />
				<input
					type="url"
					id="github"
					name="github"
					placeholder="https://github.com/user/repo"
					class="input"
					value={projectBeingUpdated?.fields.code}
				/>
			</div>

			<div>
				<label for="demo">Demo URL:</label>
				<input
					type="url"
					id="demo"
					name="demo"
					placeholder="https://example.com/demo"
					class="input"
					value={projectBeingUpdated?.fields.demo}
				/>
			</div>
			<div>
				<label for="type">Type:</label>
				<select name="type" id="type" class="input">
					<option value="web">{projectBeingUpdated?.fields.type}</option>

					<option value="web">Web Playable</option>
					<option value="mobile">Mobile App</option>
					<option value="desktop">Desktop App</option>
					<option value="terminal">Terminal App</option>
					<option value="hardware">Hardware</option>
				</select>
			</div>
			<div>
				<label for="type">Hackatime:</label>
				<select name="hackatime" id="hackatime" class="input">
					<option value={projectBeingUpdated?.fields.hackatime}>
						{projectBeingUpdated?.fields.hackatime}
					</option>
					{#each availableHacks as hack}
						<option value={hack.name}>
							{hack.name}
						</option>
					{/each}
				</select>
			</div>
			<div class="flex justify-start items-center gap-5">
				<input
					type="checkbox"
					id="projectUpdate"
					name="projectUpdate"
					class=""
					checked={projectBeingUpdated?.fields.update}
				/>
				<label for="projectUpdate"
					>My project is an update <br /> Tick this if your project started before
					June</label
				>
			</div>
			<button
				type="submit"
				class="w-40 border-red-500 border-dotted h-10 border-2 p-2 text-lg flex items-center justify-center cursor-pointer rounded-lg"
				>Update Project</button
			>
		</form>
	</div>
</div>

<style>
	.newProjectOvr {
		background-color: #000000a8;
		display: flex;
		flex-direction: column;
	}
	.form .input,
	textarea {
		background-color: transparent;
		border: 1px dotted #f00;
		color: #fff;
		padding: 0.5rem;
		border-radius: 4px;
		outline: none;
		width: 100%;
	}
	.input option {
		background-color: #000;
		color: #fff;
	}
</style>
