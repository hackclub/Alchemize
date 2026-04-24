<script lang="ts">
	interface Project {
		createdTime: string
		fields: {
			Name: string
			description: string
			github?: string
			demo?: string
			type: string
			projectUpdate?: boolean
			hackatime: string
			journals: ""
			languages: ""
			log: ""
			owner: string
		}
	}

	let { data } = $props()
	let newProjWindowOpened = $state(false)
	const openNewProjWindow = () => {
		newProjWindowOpened = true
		console.log("Opening New Project Window")
	}
	const closeNewProjWindow = () => {
		newProjWindowOpened = false
	}
	let styleNewProjWindow = $derived(newProjWindowOpened ? "flex" : "none")
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
				hack.total_seconds ?? 0
			])
		)
	)

	function formatHours(totalSeconds: number | undefined): string {
		const hours = (totalSeconds ?? 0) / 3600
		return `${hours.toFixed(1)}hr`
	}
</script>

<main
	class="bg-black h-screen w-screen flex items-center justify-center text-white gap-20"
>
	<h1 class="absolute top-10">Projects</h1>
	{#each projects as project}
		<div
			class="new-proj h-80 w-50 border-red-500 border-dashed border flex flex-col items-center justify-center gap-5 rounded-lg"
		>
			<span class="text-2xl alchemizefont">{project.fields.Name}</span>
			
			<span class="text-lg hours">
				{formatHours(
					hackSecondsByName.get(project.fields.hackatime.trim().toLowerCase())
				)}
			</span>
		</div>
	{/each}
	<div class="projects">
		<button class="proj-btn cursor-pointer" onclick={openNewProjWindow}>
			<div
				class="new-proj h-80 w-50 border-red-500 border-dashed border flex flex-col items-center justify-center gap-5 rounded-lg"
			>
				<i class="fa-solid fa-plus text-4xl"></i>
				<h2 class="text-xl alchemizefont">New Project(Work in progress)</h2>
			</div>
		</button>
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
				<label for="type">Hackatime:</label>
				<select name="hackatime" id="hackatime" class="input">
					{#each availableHacks as hack}
						<option value={hack.name}>
							{hack.name }
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
