<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog"
	import { Input } from "$lib/components/ui/input"
	import { Textarea } from "$lib/components/ui/textarea"
	import { Checkbox } from "$lib/components/ui/checkbox"
	import { Label } from "$lib/components/ui/label"
	import { Button } from "$lib/components/ui/button"

	interface Project {
		id: string
		fields: {
			Name: string
			description: string
			code?: string
			demo?: string
			type: string
			update?: boolean
			hackatime: string
		}
	}

	type HackatimeProject = {
		name?: string
		total_seconds?: number
	}

	let {
		open = $bindable(),
		mode,
		project = null,
		availableHacks,
		onship,
		showRotator = false,
	}: {
		open: boolean
		mode: "create" | "update"
		project?: Project | null
		availableHacks: HackatimeProject[]
		onship?: () => void
		showRotator?: boolean
	} = $props()

	const selectClass =
		"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="w-[90vw] min-w-[90vw] h-[90vh] max-h-[90vh] bg-background border-red-500 border-dashed overflow-hidden flex flex-col"
	>
		<Dialog.Header class="px-6 pt-6 shrink-0">
			<Dialog.Title class="text-2xl flex items-center justify-between gap-4">
				<span class="text-primary">
					{mode === "create"
						? "Create New Project"
						: `Update ${project?.fields.Name}`}
				</span>
				{#if mode === "update"}
					<Button
						variant="outline"
						class="border-orange-700 border-dashed gap-3"
						onclick={onship}
					>
						<i class="fa-solid fa-ship"></i>
						{#if showRotator}
							<div
								class="w-4 h-4 border-4 border-gray-600 border-t-white rounded-full animate-spin"
							></div>
						{/if}
						Ship
					</Button>
				{/if}
			</Dialog.Title>
		</Dialog.Header>

		<div class="overflow-y-auto flex-1 px-6 pb-6">
			<form
				method="POST"
				action={mode === "create" ? "?/create" : "?/update"}
				class="flex flex-col gap-6 pt-4"
			>
				{#if mode === "update"}
					<input type="hidden" name="recordId" value={project?.id} />
				{/if}

				<div class="flex flex-col gap-2">
					<Label for="name">Project Name</Label>
					<Input
						id="name"
						name="name"
						required
						placeholder="Project Name"
						value={project?.fields.Name ?? ""}
					/>
				</div>

				<div class="flex flex-col gap-2">
					<Label for="description">Project Description</Label>
					<Textarea
						id="description"
						name="description"
						required
						placeholder="Project Description (Markdown Allowed)"
						class="h-32"
						value={project?.fields.description ?? ""}
					/>
				</div>

				<div class="flex flex-col gap-2">
					<Label for="github">GitHub Repository URL</Label>
					<Input
						type="url"
						id="github"
						name="github"
						placeholder="https://github.com/user/repo"
						value={project?.fields.code ?? ""}
					/>
				</div>

				<div class="flex flex-col gap-2">
					<Label for="demo">Demo URL</Label>
					<Input
						type="url"
						id="demo"
						name="demo"
						placeholder="https://example.com/demo"
						value={project?.fields.demo ?? ""}
					/>
				</div>

				<div class="flex flex-col gap-2">
					<Label for="type">Type</Label>
					<select id="type" name="type" class={selectClass}>
						<option value="" disabled selected={!project?.fields.type}
							>Select a type</option
						>
						<option value="web" selected={project?.fields.type === "web"}
							>Web Playable</option
						>
						<option value="mobile" selected={project?.fields.type === "mobile"}
							>Mobile App</option
						>
						<option
							value="desktop"
							selected={project?.fields.type === "desktop"}>Desktop App</option
						>
						<option
							value="terminal"
							selected={project?.fields.type === "terminal"}
							>Terminal App</option
						>
						<option
							value="hardware"
							selected={project?.fields.type === "hardware"}>Hardware</option
						>
					</select>
				</div>

				{#if mode === "create"}
					<div class="flex flex-col gap-2">
						<Label for="theme">Theme</Label>
						<select id="theme" name="theme" class={selectClass}>
							<option value="" disabled selected>Select a theme</option>
							<option value="Sci-fi">Sci-Fi</option>
							<option value="anime">Anime</option>
							<option value="tribute">Tribute</option>
						</select>
					</div>
				{/if}

				<div class="flex flex-col gap-2">
					<Label for="hackatime">Hackatime Project</Label>
					<select id="hackatime" name="hackatime" class={selectClass}>
						<option value="" disabled selected={!project?.fields.hackatime}
							>Select a Hackatime project</option
						>
						{#if mode === "update" && project?.fields.hackatime}
							<option value={project.fields.hackatime} selected>
								{project.fields.hackatime} (current)
							</option>
						{/if}
						{#each availableHacks as hack}
							<option value={hack.name}>{hack.name}</option>
						{/each}
					</select>
				</div>

				<div class="flex items-center gap-3">
					<Checkbox
						id="projectUpdate"
						name="projectUpdate"
						checked={project?.fields.update ?? false}
					/>
					<Label for="projectUpdate">
						My project is an update — tick this if your project started before
						June
					</Label>
				</div>

				<Button
					type="submit"
					variant="outline"
					class="w-40 border-red-500 border-dashed"
				>
					{mode === "create" ? "Create Project" : "Update Project"}
				</Button>
			</form>
		</div>
	</Dialog.Content>
</Dialog.Root>
