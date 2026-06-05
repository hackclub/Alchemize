<script lang="ts">
	import { enhance } from "$app/forms"
	import * as Dialog from "$lib/components/ui/dialog"
	import { Input } from "$lib/components/ui/input"
	import { Textarea } from "$lib/components/ui/textarea"
	import { Checkbox } from "$lib/components/ui/checkbox"
	import { Label } from "$lib/components/ui/label"
	import { Button } from "$lib/components/ui/button"
	import type { AirtableProject } from "$lib/types"
	import { countCharacters } from "$lib/utils"
	type Log = {
		status: 0 | 1 | 2 //0 = Pending, 1 = Approved, 2 = Rejected
		timestamp: string
		deltaTime: number //in minutes
		message: message[]
		submmitedToHQ: boolean
	}

	type message = {
		userExternal: string
		internalNote: string
		justification: string
		timestamp: string
		reviewerName?: string
	}

	type HackatimeProject = {
		name?: string
		total_seconds?: number
	}
	let changelog = $state("")
	let changelogCharCount = $derived(countCharacters(changelog))

	let showSecondRotator = $state(false)
	let {
		open = $bindable(),
		mode,
		project = null,
		availableHacks,
		onship,
		showRotator = false,
		invalidater,
	}: {
		open: boolean
		mode: "create" | "update"
		project?: AirtableProject | null
		availableHacks: HackatimeProject[]
		onship: (agr0: string) => void
		showRotator?: boolean
		invalidater?: () => void
	} = $props()
		let description = $derived(project?.fields.description)
	let descriptionCharCount = $derived(countCharacters(description || ""))
	// console.log("log1", project)
	const log = $derived.by(() => {
		const logJson = project?.fields.log || "[]"
		try {
			return JSON.parse(logJson) as Log[]
		} catch {
			return []
		}
	})
	const shippedTime = $derived.by(() =>
		log.reduce((total, entry) => total + entry.deltaTime, 0)
	)
	console.log(project?.fields)
	const hoursShipped = $derived(Math.floor((shippedTime * 10) / 60) / 10)
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
					<div class=" flex items-center justify-center gap-4">
						<span class=" text-sm">Shipped Time: {hoursShipped} Hours</span>

						<Button
							variant="outline"
							class="border-orange-700 border-dashed gap-3"
							onclick={() => onship(changelog)}
						>
							<i class="fa-solid fa-ship"></i>
							{#if showRotator}
								<div
									class="w-4 h-4 border-4 border-gray-600 border-t-white rounded-full animate-spin"
								></div>
							{/if}
							Ship
						</Button>
					</div>
				{/if}
			</Dialog.Title>
		</Dialog.Header>
		{#if mode === "update"}
			<div class="previousReviews w-1/2 px-4 gap-4 flex flex-col">
				{#each [...log].reverse() as entry}
					{#each [...entry.message].reverse() as msg, i}
						{#if msg.reviewerName != "user"}
							<div
								class="reviewEntry border-gray-700 border w-full px-2 py-2 rounded-sm rounded-r-lg {i ===
								0
									? entry.status === 1
										? 'border-l-green-700'
										: 'border-l-red-700'
									: 'border-l-red-700'} border-l-5"
							>
								<p class=" pr-30 text-gray-300">{msg.userExternal}</p>
								<h1 class="text-xs text-gray-400">
									By {msg.reviewerName} at {new Date(
										msg.timestamp
									).toLocaleString()}
								</h1>
							</div>
						{:else}
							<div
								class="reviewEntry border-gray-700 border w-full px-2 py-2 rounded-sm rounded-r-lg border-l-amber-700 border-l-5"
							>
								<p class=" pr-30 text-gray-300">{msg.userExternal}</p>
								<h1 class="text-xs text-gray-400">
									New Ship at {new Date(msg.timestamp).toLocaleString()}
								</h1>
							</div>
						{/if}
					{/each}
				{/each}
			</div>
		{/if}
		<div class="overflow-y-auto flex-1 px-6 pb-6">
			<form
				enctype="multipart/form-data"
				method="POST"
				action={mode === "create" ? "?/create" : "?/update"}
				class="flex flex-col gap-6 pt-4"
				use:enhance={() => {
					showSecondRotator = true
					return async ({ result }) => {
						showSecondRotator = false
						invalidater?.()
					}
				}}
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
					{#if mode==="create"}
					<div
						class="w-[clamp(20px,50%,500px)] {descriptionCharCount < 20
							? 'bg-amber-800'
							: 'bg-green-800'} h-4 text-xs flex items-center px-5 gap-3 rounded-lg"
					>
						<i class="fa-solid fa-info"></i>
						{descriptionCharCount < 20
							? `Add ${20 - descriptionCharCount} more characters`
							: "Ok"}
					</div>
					{/if}
					<Textarea
						id="description"
						name="description"
						required
						placeholder="Project Description (Markdown Allowed)"
						style="background:url({project?.fields.screenshot ||
							''}) no-repeat center center / cover;"
						class="h-32"
						bind:value={description}
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
				{#if mode === "create"}
					<div class="flex flex-col gap-2">
						<Label for="demo">Screenshot</Label>
						<Input
							type="file"
							id="screenshot"
							name="screenshot"
							placeholder="https://example.com/screenshot"
							accept="image/*"
							required
						/>
					</div>
				{/if}
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
							<option value="endless">Endless</option>
							<option value="no-internet">No Internet</option>
							<option value="indie-game">Indie Gamedev</option>
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
					onclick={() => {
						if (mode === "create" && descriptionCharCount < 20) {
							alert("Please provide a description with at least 20 characters.")
							return
						}
					}}
				>
					{#if showSecondRotator}
						<div
							class="w-4 h-4 border-3 border-gray-500 border-t-white rounded-full animate-spin"
						></div>
					{/if}
					{mode === "create" ? "Create Project" : "Update Project"}
				</Button>
				{#if mode === "update"}
					<div class="flex flex-col gap-2 mt-10">
						<Label for="description">Changelog (Required for shipping)</Label>
						<div
							class="w-[clamp(20px,50%,500px)] {changelogCharCount < 20
								? 'bg-amber-800'
								: 'bg-green-800'} h-7 flex items-center px-5 gap-3 rounded-lg"
						>
							<i class="fa-solid fa-info"></i>
							{changelogCharCount < 20
								? `Add ${20 - changelogCharCount} more characters`
								: "Ok to ship"}
						</div>
						<Textarea
							id="description"
							name="description"
							placeholder="What did you add/modify? (Markdown Allowed)"
							class="h-32"
							bind:value={changelog}
						/>
					</div>
				{/if}
			</form>
		</div>
	</Dialog.Content>
</Dialog.Root>
