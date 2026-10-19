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
	import { Plus, Trash, ShieldAlert, ExternalLink } from "lucide-svelte"
	import type { Log } from "$lib/types"
	import { cn } from "$lib/lib/utils"
	import { PROJECT_TYPES, projectTypeLabel } from "$lib/projectTypes"
	import { idvShipBlock, type IdvStatus } from "$lib/idv"

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
		idvStatus,
		onship,
		showRotator = false,
		invalidater,
		onDelete,
	}: {
		open: boolean
		mode: "create" | "update"
		project?: AirtableProject | null
		availableHacks: HackatimeProject[]
		// Hack Club Auth identity verification; anything but "verified" disables shipping (the server enforces it)
		idvStatus?: IdvStatus
		// Resolves to whether the ship went through
		onship: (changelog: string) => Promise<boolean>
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
		theme = project?.fields.Theme ?? ""
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

	// The server ships the saved project, so this checks the saved fields, not unsaved edits in the form
	// (same fields as /dashboard/projects/ship requires)
	const missingShipFields = $derived.by(() => {
		const fields = project?.fields
		const required: [label: string, present: unknown][] = [
			["a description", fields?.description],
			["a theme", fields?.Theme],
			["a project type", fields?.type],
			["a repository link", fields?.code],
			["a demo link", fields?.demo],
			["a Hackatime project", fields?.hackatime],
			["both screenshots", fields?.screenshot && fields?.screenshot2],
		]
		return required.filter(([, present]) => !present).map(([label]) => label)
	})

	// Why this user can't ship yet (needs to verify, verification pending, ineligible), or null
	const idvBlock = $derived(idvStatus ? idvShipBlock(idvStatus) : null)

	const ship = async () => {
		if (idvBlock) {
			toast.error(idvBlock.message)
			return
		}
		if (missingShipFields.length > 0) {
			toast.error(`Add ${missingShipFields.join(", ")} and click Update Project before shipping.`)
			return
		}
		if (changelogCharCount < 20) {
			toast.error("Please write a changelog of at least 20 characters before shipping.")
			return
		}

		shipLoading = true
		try {
			if (await onship(changelog)) {
				changelog = ""
			}
		} finally {
			shipLoading = false
		}
	}

	const hoursShipped = $derived(Math.floor((shippedTime * 10) / 60) / 10)

	const selectClass =
		"flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"

	let files: any = $state()
	let fileinputPreview: any = $state("")
	let hasFile = $derived(files && files.length > 0)

	let files2: any = $state()
	let fileinputPreview2: any = $state("")
	let hasFile2 = $derived(files2 && files2.length > 0)

	$effect(() => {
		if (files && files.length > 0) {
			const file = files[0]
			const objectUrl = URL.createObjectURL(file)
			console.log("File input Link created dynamically:", objectUrl)
			fileinputPreview = objectUrl

			return () => {
				URL.revokeObjectURL(objectUrl)
			}
		} else if (mode === "update" && project?.fields.screenshot && !hasFile) {
			fileinputPreview = project.fields.screenshot
		} else {
			fileinputPreview = ""
		}
	})

	$effect(() => {
		if (files2 && files2.length > 0) {
			const file2 = files2[0]
			const objectUrl2 = URL.createObjectURL(file2)
			console.log("File input Link created dynamically:", objectUrl2)
			fileinputPreview2 = objectUrl2

			return () => {
				URL.revokeObjectURL(objectUrl2)
			}
		} else if (mode === "update" && project?.fields.screenshot2 && !hasFile2) {
			fileinputPreview2 = project.fields.screenshot2
		} else {
			fileinputPreview2 = ""
		}
	})

	let allFieldsFilled = $derived(
		name && description && descriptionCharCount >= 50
	)
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="min-w-[85vw] h-[90vh] max-h-[90vh] overflow-hidden flex flex-col border border-border bg-card text-foreground p-0 gap-0 shadow-2xl rounded rounded-tl-3xl rounded-br-3xl [&>button]:hidden"
	>
		<Dialog.Header
			class="relative shrink-0 overflow-hidden bg-card px-6 py-5 sm:px-8 sm:py-6 border-b"
		>
			<div
				class="relative flex flex-col sm:flex-row sm:items-end justify-between gap-5"
			>
				<div class="min-w-0">
					<p
						class="font-note text-[10px] uppercase tracking-[0.25em] text-card-foreground mb-2"
					>
						Alchemize
					</p>

					<h1
						class="font-display text-2xl sm:text-3xl font-black uppercase tracking-wide text-foreground truncate"
					>
						{mode === "create"
							? "Create New Project"
							: name || "Untitled Project"}
					</h1>
				</div>

				{#if mode === "update"}
					<div class="flex items-center gap-3 shrink-0">
						<div
							class="rounded-lg bg-secondary/70 px-4 py-2.5 text-center min-w-[82px]"
						>
							<p
								class="font-note text-[9px] uppercase tracking-widest text-muted-foreground"
							>
								Shipped
							</p>
							<p class="font-body text-lg font-black text-primary">
								{hoursShipped}hrs
							</p>
						</div>

						<div
							class="rounded-lg bg-secondary/70 px-4 py-2.5 text-center min-w-[82px]"
						>
							<p
								class="font-note text-[9px] uppercase tracking-widest text-muted-foreground"
							>
								Type
							</p>
							<p
								class="font-display text-sm font-bold text-foreground capitalize"
							>
								{type ? projectTypeLabel(type) : "—"}
							</p>
						</div>
					</div>
				{/if}
			</div>
		</Dialog.Header>

		<div
			class="flex-1 min-h-0 overflow-hidden bg-secondary/30 backdrop-blur-md"
		>
			<div
				class={mode === "update"
					? "grid grid-cols-1 lg:grid-cols-12 h-full"
					: "max-w-4xl mx-auto w-full p-6 overflow-y-auto h-full custom-scrollbar"}
			>
				{#if mode === "update"}
					<aside
						class="lg:col-span-4 flex flex-col gap-5 p-6 sm:p-8 min-h-0 bg-card/40"
					>
						<div class="flex items-center justify-between">
							<div>
								<p
									class="font-note text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
								>
									Project Logs
								</p>
								<h2
									class="font-display text-lg font-bold uppercase tracking-wide text-foreground"
								>
									Activity
								</h2>
							</div>

							<span
								class="font-display text-sm font-bold text-primary border p-3 rounded-md"
							>
								{log.length}
							</span>
						</div>

						<div
							class="flex-1 max-w-full min-h-0 overflow-y-auto space-y-3 p-2 scrollbar-thin"
						>
							{#if log.length === 0}
								<div
									class="flex items-center justify-center h-full text-center"
								>
									<p class="font-note text-sm text-muted-foreground">
										No activity yet.
									</p>
								</div>
							{:else}
								{#each [...log].reverse() as entry}
									{#each [...entry.message].reverse() as msg, i}
										{#if msg.reviewerName !== "user"}
											<div
												class={cn(
													"rounded-xl bg-secondary/60 p-4 transition-colors hover:bg-secondary",
													i === 0 || msg.reviewerName?.includes("APPROVED")
														? entry.status === 1 ||
															msg.reviewerName?.includes("APPROVED")
															? "shadow-[inset_3px_0_0_0] shadow-emerald-600"
															: "shadow-[inset_3px_0_0_0] shadow-rose-600"
														: "shadow-[inset_3px_0_0_0] shadow-rose-600"
												)}
											>
												<p
													class="font-body text-sm text-foreground leading-relaxed mb-2"
												>
													{msg.userExternal}
												</p>

												<div
													class="flex flex-wrap items-center gap-1.5 font-note text-[10px] text-muted-foreground"
												>
													<span>{msg.reviewerName}</span>
													<span>•</span>
													<span>
														{new Date(msg.timestamp).toLocaleString([], {
															dateStyle: "short",
															timeStyle: "short",
														})}
													</span>
												</div>
											</div>
										{:else}
											<div
												class="rounded-xl bg-secondary/60 p-4 shadow-[inset_3px_0_0_0] shadow-amber-600 transition-colors hover:bg-secondary"
											>
												<p
													class="font-body text-sm text-foreground wrap-break-word leading-relaxed mb-2"
												>
													{msg.userExternal}
												</p>

												<div
													class="flex flex-wrap items-center gap-1.5 font-note text-[10px] text-muted-foreground"
												>
													<span class="font-bold text-amber-300">
														New Ship Update
													</span>
													<span>•</span>
													<span>
														{new Date(msg.timestamp).toLocaleString([], {
															dateStyle: "short",
															timeStyle: "short",
														})}
													</span>
												</div>
											</div>
										{/if}
									{/each}
								{/each}
							{/if}
						</div>

						{#if idvBlock}
							<div
								role="status"
								class={cn(
									"rounded-xl bg-secondary/60 p-4 flex flex-col gap-3 shadow-[inset_3px_0_0_0]",
									idvStatus === "ineligible" ? "shadow-rose-600" : "shadow-amber-600"
								)}
							>
								<div class="flex items-center gap-2">
									<ShieldAlert
										class={cn(
											"size-4 shrink-0",
											idvStatus === "ineligible" ? "text-rose-500" : "text-amber-500"
										)}
									/>
									<p
										class="font-display text-sm font-bold uppercase tracking-wide text-foreground"
									>
										{idvBlock.title}
									</p>
								</div>
								<p class="font-body text-sm text-foreground leading-relaxed">
									{idvBlock.message}
								</p>
								{#if idvBlock.link}
									<Button
										href={idvBlock.link.href}
										target="_blank"
										rel="noopener noreferrer"
										variant="outline"
										size="xs"
										class="self-start font-display font-bold uppercase tracking-wider text-xs"
									>
										{idvBlock.link.label}
										<ExternalLink class="size-3.5" />
									</Button>
								{/if}
							</div>
						{:else if idvStatus === "unavailable"}
							<p class="font-note text-xs text-muted-foreground">
								Couldn't check your identity verification right now. It will be checked again when you ship.
							</p>
						{/if}

						<Button
							variant="primary"
							class="w-full h-10 font-display font-bold uppercase tracking-wider text-xs"
							onclick={ship}
							disabled={shipLoading || showRotator || !!idvBlock}
							title={idvBlock?.title}
						>
							{#if shipLoading || showRotator}
								<div
									class="size-4 border-2 border-muted-foreground border-t-primary-foreground rounded-full animate-spin mr-2"
								></div>
							{/if}

							<Plus class="mr-1 h-4 w-4" />
							Ship
						</Button>
					</aside>
				{/if}

				{#if mode === "update" || mode === "create"}
					<form
						enctype="multipart/form-data"
						method="POST"
						action={mode === "create" ? "?/create" : "?/update"}
						class="flex flex-col h-full min-h-0 {mode === 'update'
							? 'lg:col-span-8'
							: 'w-full'}"
						use:enhance={() => {
							showSecondRotator = true

							return async ({ result }) => {
								showSecondRotator = false

								if (result.type === "success") {
									invalidater?.()
									open = false
								} else if (result.type === "failure") {
									toast.error(
										(result.data?.message as string | undefined) ??
											"Could not save the project, please try again."
									)
								} else if (result.type === "error") {
									toast.error(
										result.error?.message ??
											"Could not save the project, please try again."
									)
								}
							}
						}}
					>
						{#if mode === "update"}
							<input type="hidden" name="recordId" value={project?.id} />
						{/if}

						<div
							class="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar"
						>
							<section class="space-y-5">
								<h2
									class="font-display text-lg font-bold uppercase tracking-wide text-foreground"
								>
									Project Details
								</h2>

								<div class="space-y-2">
									<Label
										for="name"
										class="font-display text-xs font-bold uppercase tracking-wider text-foreground"
									>
										Project Name
									</Label>

									<Input
										id="name"
										name="name"
										required
										placeholder="Give your cool project a name"
										bind:value={name}
										class="bg-input border-border text-foreground placeholder:text-muted-foreground font-body"
									/>
								</div>

								<div class="space-y-2">
									<div class="flex items-center justify-between gap-3">
										<Label
											for="description"
											class="font-display text-xs font-bold uppercase tracking-wider text-foreground"
										>
											Project Description
										</Label>

										{#if mode === "create"}
											<span
												class={cn(
													"font-note text-[10px] font-semibold px-2 py-1 rounded-full",
													descriptionCharCount < 50
														? "border border-amber-400/30 bg-amber-500/15 text-amber-300"
														: "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
												)}
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
										class="h-36 bg-input border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary resize-none leading-relaxed font-body"
										bind:value={description}
									/>
								</div>

								<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div class="space-y-2">
										<Label
											for="github"
											class="font-display text-xs font-bold uppercase tracking-wider text-foreground"
										>
											GitHub Repository
										</Label>

										<Input
											type="url"
											id="github"
											name="github"
											placeholder="https://github.com/..."
											bind:value={github}
											class="bg-input border-border text-foreground placeholder:text-muted-foreground font-body"
										/>
									</div>

									<div class="space-y-2">
										<Label
											for="demo"
											class="font-display text-xs font-bold uppercase tracking-wider text-foreground"
										>
											Live Demo URL
										</Label>

										<Input
											type="url"
											id="demo"
											name="demo"
											placeholder="https://..."
											bind:value={demo}
											class="bg-input border-border text-foreground placeholder:text-muted-foreground font-body"
										/>
									</div>
								</div>
							</section>

							<section class="space-y-5">
								<div>
									<h2
										class="font-display text-lg font-bold uppercase tracking-wide text-foreground"
									>
										Project Screenshots <br />
									</h2>
									<span class="text-xs font-note"
										>Add 2 completely distinct screenshots showing different
										angles of your project</span
									>
								</div>

								<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div class="space-y-2">
										<Label
											for="screenshot-1"
											class="font-display text-xs font-bold uppercase tracking-wider text-foreground"
										>
											Screenshot 1
										</Label>

										<label
											for="screenshot-1"
											class="relative flex flex-col items-center justify-center w-full h-36 rounded-xl cursor-pointer bg-card border-2 border-dashed border-border hover:border-primary/60 transition overflow-hidden"
											style={fileinputPreview
												? `background-image: url('${fileinputPreview}'); background-size: contain; background-position: center; background-repeat: no-repeat;`
												: ""}
										>
											<div
												class={cn(
													"absolute inset-0 flex flex-col items-center justify-center text-center p-4",
													fileinputPreview
														? "bg-background/70 backdrop-blur-[2px]"
														: ""
												)}
											>
												<p
													class="font-body text-xs text-foreground font-medium"
												>
													{hasFile
														? "Screenshot ready to upload"
														: "Click to upload a screenshot"}
												</p>

												<p
													class="font-note text-[10px] text-muted-foreground mt-1"
												>
													PNG, JPG up to 5MB
												</p>
											</div>

											<input
												id="screenshot-1"
												name="screenshot"
												type="file"
												accept="image/png, image/jpeg"
												class="hidden"
												bind:files
											/>
										</label>
									</div>

									<div class="space-y-2">
										<Label
											for="screenshot-2"
											class="font-display text-xs font-bold uppercase tracking-wider text-foreground"
										>
											Screenshot 2
										</Label>

										<label
											for="screenshot-2"
											class="relative flex flex-col items-center justify-center w-full h-36 rounded-xl cursor-pointer bg-card border-2 border-dashed border-border hover:border-primary/60 transition overflow-hidden"
											style={fileinputPreview2
												? `background-image: url('${fileinputPreview2}'); background-size: contain; background-position: center; background-repeat: no-repeat;`
												: ""}
										>
											<div
												class={cn(
													"absolute inset-0 flex flex-col items-center justify-center text-center p-4",
													fileinputPreview2
														? "bg-background/70 backdrop-blur-[2px]"
														: ""
												)}
											>
												<p
													class="font-body text-xs text-foreground font-medium"
												>
													{hasFile2
														? "Screenshot ready to upload"
														: "Click to upload a screenshot"}
												</p>

												<p
													class="font-note text-[10px] text-muted-foreground mt-1"
												>
													PNG, JPG up to 5MB
												</p>
											</div>

											<input
												id="screenshot-2"
												name="screenshot-2"
												type="file"
												accept="image/png, image/jpeg"
												class="hidden"
												bind:files={files2}
											/>
										</label>
									</div>
								</div>
							</section>

							<section class="space-y-5">
								<h2
									class="font-display text-lg font-bold uppercase tracking-wide text-foreground"
								>
									Project Settings
								</h2>

								<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div class="space-y-2">
										<Label
											for="type"
											class="font-display text-xs font-bold uppercase tracking-wider text-foreground"
										>
											Project Type
										</Label>

										<select
											id="type"
											name="type"
											class={selectClass}
											bind:value={type}
										>
											<option value="" disabled selected={!type}>
												Choose Type
											</option>
											{#each PROJECT_TYPES as projectType}
												<option value={projectType.value}>{projectType.label}</option>
											{/each}
										</select>
									</div>

									<div class="space-y-2">
										<Label
											for="theme"
											class="font-display text-xs font-bold uppercase tracking-wider text-foreground"
										>
											Project Theme
										</Label>

										<select
											id="theme"
											name="theme"
											class={selectClass}
											bind:value={theme}
										>
											<option value="" disabled selected> Choose Theme </option>
											<option value="endless">Bots</option>
											<option value="no-internet">Co-op</option>
											<option value="indie-game">Electroart</option>
										</select>
									</div>

									<div
										class="space-y-2 {mode === 'update' ? 'sm:col-span-2' : ''}"
									>
										<Label
											for="hackatime"
											class="font-display text-xs font-bold uppercase tracking-wider text-foreground"
										>
											Hackatime Project
										</Label>

										<select
											id="hackatime"
											name="hackatime"
											class={selectClass}
											bind:value={hackatime}
										>
											<option value="" disabled selected={!hackatime}>
												Choose
											</option>

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

								<div class="flex items-start gap-3 rounded-xl bg-card p-4">
									<Checkbox
										id="projectUpdate"
										name="projectUpdate"
										bind:checked={projectUpdate}
										class="mt-1 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
									/>

									<div class="grid gap-1 leading-none">
										<Label
											for="projectUpdate"
											class="font-display text-xs font-bold text-foreground cursor-pointer"
										>
											This is an update
										</Label>

										<p
											class="font-note text-[11px] text-muted-foreground leading-normal"
										>
											Check this if your project was started before June 18th
											2026.
										</p>
									</div>
								</div>
							</section>

							{#if mode === "update"}
								<section class="space-y-4">
									<div class="flex items-end justify-between gap-3">
										<div>
											<p
												class="font-note text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
											>
												Shipping
											</p>

											<h2
												class="font-display text-lg font-bold uppercase tracking-wide text-foreground"
											>
												Changelog
											</h2>
										</div>

										<span
											class={cn(
												"font-note text-[10px] font-semibold px-2 py-1 rounded-full",
												idvBlock || changelogCharCount < 20
													? "border border-amber-400/30 bg-amber-500/15 text-amber-300"
													: "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
											)}
										>
											{idvBlock
												? idvBlock.title
												: changelogCharCount < 20
													? `${20 - changelogCharCount} more chars needed to ship`
													: "Ready to ship"}
										</span>
									</div>

									<Textarea
										id="changelog"
										name="changelog"
										placeholder="Describe what changes you made since your last ship, or if it is your first ship, describe what you made..."
										class="h-32 bg-input border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary resize-none leading-relaxed font-body"
										bind:value={changelog}
									/>
								</section>
							{/if}
						</div>

						<div
							class="shrink-0 flex flex-wrap items-center justify-end gap-3 border-t px-6 sm:px-8 py-4"
						>
							<Button
								type="button"
								variant="outline"
								class="font-display text-xs font-bold uppercase tracking-wider h-10"
								onclick={() => (open = false)}
							>
								Cancel
							</Button>

							{#if mode === "update"}
								<Button
									type="button"
									variant="destructive"
									class="font-display text-xs font-bold uppercase tracking-wider h-10"
									onclick={onDelete}
									disabled={shipLoading ||
										showSecondRotator ||
										JSON.parse(project?.fields?.log || "[]").length > 1}
								>
									<Trash class="size-4 mr-1" />
									Delete Project
								</Button>
							{/if}

							<div
								class={cn(
									"pointer-events-auto",
									!allFieldsFilled && "pointer-events-none cursor-not-allowed"
								)}
							>
								<Button
									disabled={!allFieldsFilled ||
										showSecondRotator ||
										shipLoading}
									type="submit"
									class={cn(
										"bg-primary hover:bg-primary/80 text-primary-foreground font-display text-xs font-bold uppercase tracking-wider px-6 h-10",
										!allFieldsFilled && "pointer-events-none"
									)}
									onclick={() => {
										if (!name || !description) {
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
											class="w-3.5 h-3.5 border-2 border-muted-foreground border-t-primary-foreground rounded-full animate-spin mr-2"
										></div>
									{/if}

									{mode === "create" ? "Initialize Project" : "Update Project"}
								</Button>
							</div>
						</div>
					</form>
				{/if}
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
