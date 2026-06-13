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
	import { toast } from "svelte-sonner"
	import { Trash } from "lucide-svelte"

	type Log = {
		status: 0 | 1 | 2
		timestamp: string
		deltaTime: number
		message: message[]
		submmitedToHQ: boolean
	}

	type message = {
		userExternal: string
		internalNote: string
		justifycontent: string
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
		onDelete,
	}: {
		open: boolean
		mode: "create" | "update"
		project?: AirtableProject | null
		availableHacks: HackatimeProject[]
		onship: (agr0: string) => void
		showRotator?: boolean
		invalidater?: () => void
		onDelete: () => void
	} = $props()

	let name = $state("")
	let description = $state("")
	let github = $state("")
	let demo = $state("")
	let type = $state("")
	let theme = $state("")
	let hackatime = $state("")
	let projectUpdate = $state(false)

	$effect(() => {
		name = project?.fields.Name ?? ""
		description = project?.fields.description ?? ""
		github = project?.fields.code ?? ""
		demo = project?.fields.demo ?? ""
		type = project?.fields.type ?? ""
		hackatime = project?.fields.hackatime ?? ""
		projectUpdate = project?.fields.update ?? false
	})

	let descriptionCharCount = $derived(countCharacters(description))

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
	let shipLoading = $state(false)
	const ship = () => {
		if (changelog.trim().length < 20) {
			toast.error("Please provide a changelog before shipping.")
			return
		}

		shipLoading = true
		onship(changelog)
		changelog = ""
		shipLoading = false
	}
	const hoursShipped = $derived(Math.floor((shippedTime * 10) / 60) / 10)
	const selectClass =
		"flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-zinc-100"

	let files: any = $state()
	let fileinputPreview: any = $state("")
	let hasFile = $derived(files && files.length > 0)

	$effect(() => {
		if (files && files.length > 0) {
			const file = files[0]
			const objectUrl = URL.createObjectURL(file)
			console.log("File input Link created dynamically:", objectUrl)
			fileinputPreview = objectUrl

			// Cleanup: revoke the URL when files change or component destroys
			return () => {
				URL.revokeObjectURL(objectUrl)
			}
		} else {
			fileinputPreview = ""
		}
	})
	let allFieldsFilled = $derived(
		name &&
			description &&
			type &&
			github &&
			demo &&
			hackatime &&
			(mode === "update" || files?.length > 0) &&
			descriptionCharCount >= 50 &&
			(mode === "update" ? changelogCharCount >= 20 : true)
	)
</script>

<Dialog.Root bind:open >
	<Dialog.Content
		class="min-w-[85vw]  h-[90vh] max-h-[90vh] overflow-hidden flex flex-col border border-zinc-800 bg-zinc-950 text-zinc-50 p-0 gap-0 shadow-2xl"
	>
		<Dialog.Header class="p-0 shrink-0 border-b border-zinc-800">
			<div
				class="relative overflow-hidden bg-gradient-to-r from-red-950/20 via-zinc-900/40 to-zinc-950 p-6"
			>
				{#if mode === "update" && project?.fields.screenshot}
					<img
						src={project.fields.screenshot}
						alt=""
						class="absolute inset-0 h-full w-full object-cover opacity-10 pointer-events-none filter blur-sm"
					/>
				{/if}

				<div
					class="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4"
				>
					<div>
						<p
							class="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500 mb-1"
						>
							Alchemize Projects
						</p>
						<h1
							class="text-2xl sm:text-3xl font-black tracking-tight text-zinc-100"
						>
							{mode === "create"
								? "Create New Project"
								: name || "Untitled Project"}
						</h1>
					</div>

					{#if mode === "update"}
						<div class="flex items-center gap-3 self-start sm:self-auto">
							<div
								class="rounded-lg border border-zinc-800 bg-zinc-900/50 backdrop-blur px-4 py-2 text-center min-w-[80px]"
							>
								<div
									class="text-[10px] font-medium uppercase tracking-wider text-zinc-400"
								>
									Shipped
								</div>
								<div class="text-lg font-bold text-red-400">
									{hoursShipped}h
								</div>
							</div>
							<div
								class="rounded-lg border border-zinc-800 bg-zinc-900/50 backdrop-blur px-4 py-2 text-center min-w-[80px]"
							>
								<div
									class="text-[10px] font-medium uppercase tracking-wider text-zinc-400"
								>
									Type
								</div>
								<div class="text-lg font-bold text-zinc-200 capitalize">
									{type || "—"}
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</Dialog.Header>

		<div class="flex-1 overflow-y-auto p-6 bg-zinc-950">
			<div
				class={mode === "update"
					? "grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
					: "max-w-3xl mx-auto w-full"}
			>
				{#if mode === "update"}
					<div
						class="lg:col-span-4 flex flex-col gap-4 order-2 lg:order-1 lg:sticky lg:top-0"
					>
						<h3
							class="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-2"
						>
							<span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
							Review Timeline & Activity
						</h3>
						<div
							class="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar"
						>
							{#each [...log].reverse() as entry}
								{#each [...entry.message].reverse() as msg, i}
									{#if msg.reviewerName != "user"}
										<div
											class="group border border-zinc-800 bg-zinc-900/30 rounded-xl p-4 transition hover:bg-zinc-900/50 border-l-4 {i ===
											0
												? entry.status === 1
													? 'border-l-emerald-500'
													: 'border-l-rose-500'
												: 'border-l-rose-500'}"
										>
											<p
												class="text-sm text-zinc-300 leading-relaxed font-medium mb-2"
											>
												{msg.userExternal}
											</p>
											<div
												class="flex items-center gap-1.5 text-[11px] text-zinc-500"
											>
												<span class="font-semibold text-zinc-400"
													>{msg.reviewerName}</span
												>
												<span>•</span>
												<span
													>{new Date(msg.timestamp).toLocaleString([], {
														dateStyle: "short",
														timeStyle: "short",
													})}</span
												>
											</div>
										</div>
									{:else}
										<div
											class="group border border-zinc-800 bg-zinc-900/30 rounded-xl p-4 transition hover:bg-zinc-900/50 border-l-4 border-l-amber-500"
										>
											<p
												class="text-sm text-zinc-300 leading-relaxed font-medium mb-2"
											>
												{msg.userExternal}
											</p>
											<div
												class="flex items-center gap-1.5 text-[11px] text-zinc-500"
											>
												<span class="font-semibold text-amber-500/90"
													>New Ship Update</span
												>
												<span>•</span>
												<span
													>{new Date(msg.timestamp).toLocaleString([], {
														dateStyle: "short",
														timeStyle: "short",
													})}</span
												>
											</div>
										</div>
									{/if}
								{/each}
							{/each}
							<Button
								variant="default"
								class="w-full hover:bg-primary/70 hover:-translate-y-px"
								onclick={ship}
							>
								{#if showRotator}
									<div
										class="size-5 border-2 border-gray-500 border-t-white rounded-full animate-spin"
									></div>
								{/if}
								<i class="fa-solid fa-plus"></i> Ship
							</Button>
						</div>
					</div>
				{/if}

				<form
					enctype="multipart/form-data"
					method="POST"
					action={mode === "create" ? "?/create" : "?/update"}
					class="space-y-6 order-1 lg:order-2 {mode === 'update'
						? 'lg:col-span-8 border-b lg:border-b-0 pb-6 lg:pb-0 border-zinc-800'
						: ''}"
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

					<div class="space-y-2">
						<Label
							for="name"
							class="text-xs font-semibold uppercase tracking-wider text-zinc-400"
							>Project Name</Label
						>
						<Input
							id="name"
							name="name"
							required
							placeholder="Give your masterpiece a name"
							bind:value={name}
							class="bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-red-500 focus-visible:border-transparent"
						/>
					</div>

					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<Label
								for="description"
								class="text-xs font-semibold uppercase tracking-wider text-zinc-400"
								>Project Description</Label
							>
							{#if mode === "create"}
								<span
									class="text-[11px] font-medium px-2 py-0.5 rounded-full {descriptionCharCount <
									50
										? 'bg-amber-500/10 text-amber-400'
										: 'bg-emerald-500/10 text-emerald-400'}"
								>
									{descriptionCharCount < 50
										? `${50 - descriptionCharCount} more chars needed`
										: "Length OK"}
								</span>
							{/if}
						</div>
						<Textarea
							id="description"
							name="description"
							required
							placeholder="Describe what you are building. Markdown is fully supported."
							class="h-36 bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-red-500 focus-visible:border-transparent resize-none leading-relaxed"
							bind:value={description}
						/>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div class="space-y-2">
							<Label
								for="github"
								class="text-xs font-semibold uppercase tracking-wider text-zinc-400"
								>GitHub Repository</Label
							>
							<Input
								type="url"
								id="github"
								name="github"
								placeholder="https://github.com/..."
								bind:value={github}
								class="bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-red-500"
							/>
						</div>

						<div class="space-y-2">
							<Label
								for="demo"
								class="text-xs font-semibold uppercase tracking-wider text-zinc-400"
								>Live Demo URL</Label
							>
							<Input
								type="url"
								id="demo"
								name="demo"
								placeholder="https://..."
								bind:value={demo}
								class="bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-red-500"
							/>
						</div>
					</div>

					{#if mode === "create"}
						<div class="space-y-2">
							<Label
								for="screenshot"
								class="text-xs font-semibold uppercase tracking-wider text-zinc-400"
								>Cover Screenshot</Label
							>
							<div class="flex items-center justify-center w-full">
								<label
									for="screenshot"
									class="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer border-zinc-800 hover:border-zinc-700 transition"
									style={fileinputPreview
										? `background-image: url('${fileinputPreview}'); background-size: contain; background-position: center; filter: backdrop-blur(2px);`
										: "background-color: transparent;"}
								>
									<div
										class="flex flex-col items-center justify-center pt-3 pb-3"
									>
										<p class="text-xs text-zinc-400 font-medium">
											{hasFile
												? "Screenshot ready to upload"
												: "Click to upload a screenshot"}
										</p>
										<p class="text-[10px] text-zinc-600 mt-1">
											PNG, JPG, GIF up to 5MB
										</p>
									</div>
									<input
										id="screenshot"
										name="screenshot"
										type="file"
										accept="image/*"
										required
										class="hidden"
										bind:files
									/>
								</label>
							</div>
						</div>
					{/if}

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div class="space-y-2">
							<Label
								for="type"
								class="text-xs font-semibold uppercase tracking-wider text-zinc-400"
								>Project Type</Label
							>
							<select
								id="type"
								name="type"
								class={selectClass}
								bind:value={type}
							>
								<option value="" disabled selected={!type}>Choose Type</option>
								<option value="web">Web Playable</option>
								<option value="mobile">Mobile App</option>
								<option value="desktop">Desktop App</option>
								<option value="terminal">Terminal App</option>
								<option value="hardware">Hardware Build</option>
							</select>
						</div>

						{#if mode === "create"}
							<div class="space-y-2">
								<Label
									for="theme"
									class="text-xs font-semibold uppercase tracking-wider text-zinc-400"
									>Project Theme</Label
								>
								<select
									id="theme"
									name="theme"
									class={selectClass}
									bind:value={theme}
								>
									<option value="" disabled selected>Choose Theme</option>
									<option value="endless">Endless Track</option>
									<option value="no-internet">No Internet Required</option>
									<option value="indie-game">Indie Game Framework</option>
								</select>
							</div>
						{/if}

						<div class="space-y-2 {mode === 'update' ? 'sm:col-span-2' : ''}">
							<Label
								for="hackatime"
								class="text-xs font-semibold uppercase tracking-wider text-zinc-400"
								>Hackatime Project</Label
							>
							<select
								id="hackatime"
								name="hackatime"
								class={selectClass}
								bind:value={hackatime}
							>
								<option value="" disabled selected={!hackatime}>Chooose</option>
								{#if mode === "update" && project?.fields.hackatime}
									<option value={project.fields.hackatime}>
										{project.fields.hackatime} (Currently connected)
									</option>
								{/if}
								{#each availableHacks as hack}
									<option value={hack.name}>{hack.name}</option>
								{/each}
							</select>
						</div>
					</div>

					<div
						class="flex items-start gap-3 p-4 bg-zinc-900/30 border border-zinc-900 rounded-xl"
					>
						<Checkbox
							id="projectUpdate"
							name="projectUpdate"
							bind:checked={projectUpdate}
							class="mt-1 border-zinc-700 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
						/>
						<div class="grid gap-1 leading-none">
							<Label
								for="projectUpdate"
								class="text-xs font-semibold text-zinc-200 cursor-pointer"
								>This is an update</Label
							>
							<p class="text-[11px] text-zinc-500 leading-normal">
								Check this if your project was started before June.
							</p>
						</div>
					</div>

					{#if mode === "update"}
						<div class="space-y-2 border-t border-zinc-900 pt-6">
							<div class="flex items-center justify-between">
								<Label
									for="changelog"
									class="text-xs font-bold uppercase tracking-wider text-red-400"
									>Shipping Log / Changelog</Label
								>
								<span
									class="text-[11px] font-medium px-2 py-0.5 rounded-full {changelogCharCount <
									20
										? 'bg-amber-500/10 text-amber-400'
										: 'bg-emerald-500/10 text-emerald-400'}"
								>
									{changelogCharCount < 20
										? `${20 - changelogCharCount} more chars needed to ship`
										: "Ready to ship"}
								</span>
							</div>
							<Textarea
								id="changelog"
								name="description"
								placeholder="Detail exactly what patches, UI improvements, or features you rolled out in this sync..."
								class="h-32 bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-red-500 focus-visible:border-transparent resize-none"
								bind:value={changelog}
							/>
						</div>
					{/if}

					<div
						class="flex items-center justify-end gap-3 pt-4 border-t border-zinc-900"
					>
						{#if mode === "update"}
						<Button
							
							type="button"
							variant="destructive"
							class="text-xs font-semibold uppercase tracking-wider "
							onclick={onDelete}
						>
							<Trash/> Delete Project
						</Button>
						{/if}
						<Button
							type="button"
							variant="ghost"
							class="text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-200"
							onclick={() => (open = false)}
						>
							Cancel
						</Button>
						<Dialog.Close>
							<Button
								disabled={!allFieldsFilled || showSecondRotator || shipLoading}
								type="submit"
								class="bg-primary hover:bg-primary/80 text-white text-xs font-bold uppercase tracking-wider px-6 h-10 shadow-lg shadow-red-950/20"
								onclick={() => {
									//Check for all the fields
									if (
										!name ||
										!description ||
										!type ||
										!github ||
										!demo ||
										!hackatime ||
										files?.length === 0
									) {
										toast.error("Please fill in all required fields.")
										return
									}

									if (mode === "create" && descriptionCharCount < 50) {
										toast.error(
											"Please provide a description with at least 50 characters."
										)
										return
									}
								}}
							>
								{#if showSecondRotator}
									<div
										class="w-3.5 h-3.5 border-2 border-zinc-400 border-t-white rounded-full animate-spin mr-2"
									></div>
								{/if}
								{mode === "create" ? "Initialize Project" : "Update Project"}
							</Button>
						</Dialog.Close>
					</div>
				</form>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #27272a;
		border-radius: 2px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: #3f3f46;
	}
</style>
