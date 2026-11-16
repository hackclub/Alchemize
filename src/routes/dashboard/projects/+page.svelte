<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte"
	import Navigation from "$lib/components/navigation.svelte"
	import ProjectDialog from "$lib/components/project-dialog.svelte"
	import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js"
	import { Plus, Clock, ArrowUpRight, Blocks } from "lucide-svelte"

	import { invalidateAll } from "$app/navigation"
	import { loaderStore } from "$lib/stores/loader"

	import { formatHours, getHackatimeProjects } from "$lib/utils"
	import { toast } from "svelte-sonner"
	import type { AirtableProject } from "$lib/types"
	import type { IdvStatus } from "$lib/idv"

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

	// Identity verification status from the page load; a refused ship updates it if it changed since
	let idvStatus: IdvStatus | undefined = $state(data?.idvStatus)

	$effect(() => {
		idvStatus = data?.idvStatus
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
				.map(name => name.trim())
				.filter(Boolean)
		)
	)

	let availableHacks = $derived(
		hacks.filter(hack => {
			const hackName = hack.name ?? hack.project_name ?? hack.project ?? ""

			return Boolean(hackName) && !usedHackatimes.has(hackName)
		})
	)

	let hackSecondsByName = $derived(
		new Map(hacks.map(hack => [hack.name ?? hack.project_name ?? hack.project ?? "", hack.total_seconds ?? 0]))
	)

	function openUpdateProjWindow(project: AirtableProject) {
		projectBeingUpdated = project
		updateProjWindowOpened = true
	}

	function applyBadge(project: AirtableProject) {
		const status = project.fields.status?.toLowerCase() ?? ""
		if (status.startsWith("pending")) {
			return {
				dot: "bg-foreground",
				badge: "border-border bg-secondary text-secondary-foreground",
				title: "pending",
			}
		}
		if (status.startsWith("rejected")) {
			return {
				dot: "bg-red-500",
				badge: "border-red-400/30 bg-red-500/15 text-red-300",
				title: "changes needed",
			}
		}
		if (status.startsWith("accepted_t2")) {
			return {
				dot: "bg-emerald-500",
				badge: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
				title: "approved",
			}
		} else if (status.startsWith("accepted")) {
			return {
				dot: "bg-amber-500",
				badge: "border-amber-400/30 bg-amber-500/15 text-amber-300",
				title: "under review",
			}
		}
		return {
			dot: "bg-blue-500",
			badge: "border-blue-400/30 bg-blue-500/15 text-blue-300",
			title: "unshipped",
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

	// Ship endpoint errors are plain text; hooks (rate limit, maintenance) and SvelteKit errors are JSON {message}
	function parseShipResponse(body: string): {
		message?: string
		newLog?: unknown
		newStatus?: string
		idvStatus?: IdvStatus
	} {
		try {
			const parsed = JSON.parse(body)
			if (parsed && typeof parsed === "object") return parsed
		} catch {
			// plain text
		}
		return { message: body }
	}

	// Resolves to whether the ship went through, so the dialog only clears the changelog on success
	async function shipProject(changelog: string): Promise<boolean> {
		if (changelog.trim().length < 20) {
			toast.error("Please provide a changelog before shipping.")
			return false
		}

		const project = projectBeingUpdated
		if (!project) return false

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
			// The body can only be read once
			const responseData = parseShipResponse(await response.text())

			if (!response.ok) {
				// Refused for identity verification: disable the Ship button with the explanation
				if (response.status === 403 && responseData.idvStatus) {
					idvStatus = responseData.idvStatus
				}
				toast.error(`${responseData.message || "Shipping failed"} (code ${response.status})`)
				return false
			}
			// 207: shipped, only the Slack notification failed
			toast.success(responseData.message || "Project shipped successfully!")

			const updatedProject = {
				...project,
				fields: {
					...project.fields,
					...(responseData.newLog ? { log: JSON.stringify(responseData.newLog) } : {}),
					...(responseData.newStatus ? { status: responseData.newStatus } : {}),
				},
			}
			// The dialog may have been switched to another project while the request was running
			if (projectBeingUpdated?.id === project.id) {
				projectBeingUpdated = updatedProject
			}
			projects = projects.map(p => (p.id === updatedProject.id ? updatedProject : p))

			await invalidateAll()
			return true
		} catch (error) {
			console.error("Ship request failed:", error)
			toast.error("Couldn't reach Alchemize, please check your connection and try again")
			return false
		} finally {
			showRotator = false
		}
	}
	let isDeleteDialogOpen = $state(false)
	const onDelete = () => {
		isDeleteDialogOpen = true
	}
	const deleteProject = async () => {
		if (!projectBeingUpdated) return

		showRotator = true

		try {
			const response = await fetch("/dashboard/projects/delete", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					recordId: projectBeingUpdated.id,
				}),
				credentials: "include",
			})

			toast(response.ok ? "Project deleted successfully!" : `${await response.text()}. Code: ${response.status} `)

			if (response.ok) {
				projects = projects.filter(p => p.id !== projectBeingUpdated?.id)
				projectBeingUpdated = null
				updateProjWindowOpened = false
			}

			await invalidateAll()
		} finally {
			showRotator = false
			isDeleteDialogOpen = false
		}
	}
</script>

<svelte:head>
	<title>Alchemize | Projects</title>
	<meta name="description" content="Alchemize projects" />
	<meta property="og:title" content="Alchemize | Projects" />
</svelte:head>

<div class="abosulte z-90">
	<AlertDialog.Root open={isDeleteDialogOpen} onOpenChange={open => (isDeleteDialogOpen = open)}>
		<AlertDialog.Content class="z-60 backdrop:blur-lg">
			<AlertDialog.Header>
				<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
				<AlertDialog.Description>
					This action cannot be undone. This will permanently delete your Project and remove the project from our
					servers.
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
				<AlertDialog.Action>
					<button onclick={deleteProject}>Continue</button>
				</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
</div>

<main class="flex h-full max-h-full w-full flex-col gap-8 px-10 py-6">
	<div class="flex items-end justify-between border-b-2 px-8 py-3">
		<div class="flex items-center gap-3 text-foreground">
			<Blocks class="size-5" />
			<h1 class="line-clamp-1 font-display text-2xl font-black tracking-wider uppercase">Your Mixes</h1>
		</div>

		<div class="flex items-center gap-3">
			<Button size="sm" variant="outline" onclick={() => (newProjWindowOpened = true)}>
				<Plus class="mr-1 size-4 stroke-3" />
				<span>New Mix</span>
			</Button>
			<Navigation inline />
		</div>
	</div>

	<div class="flex flex-col gap-6 overflow-y-auto px-15 py-5 pb-24">
		{#if projects.length}
			{#each projects as project}
				<button
					class="flex min-h-[28vh] w-full items-center gap-5 overflow-hidden rounded-md rounded-tl-2xl rounded-br-2xl border-2 border-border bg-card p-2 py-2 text-card-foreground transition hover:-translate-x-0.5 hover:-translate-y-0.5"
					onclick={() => openUpdateProjWindow(project)}>
					<div class="h-full w-[35%] shrink-0 overflow-hidden">
						{#if project.fields.screenshot}
							<img src={project.fields.screenshot} alt="" class="h-full w-full rounded-xl border object-cover" />
						{:else}
							<div class="flex h-full w-full items-center justify-center rounded-xl border">No Image</div>
						{/if}
					</div>

					<div class="flex h-full min-h-0 w-full min-w-0 flex-col justify-between gap-4 p-2">
						<div class=" flex flex-col items-end gap-2">
							<h2 class="truncate font-display text-3xl font-bold">
								{project.fields.Name || "Untitled Mix"}
							</h2>

							<p class="line-clamp-5 text-muted-foreground">
								{project.fields.description || "No description."}
							</p>
						</div>

						<div class="flex items-center justify-between">
							<div
								class={`inline-flex items-center gap-2 self-start rounded-full border px-2 py-1 font-body text-xs uppercase ${applyBadge(project).badge}`}>
								<span class={`h-2 w-2 rounded-full ${applyBadge(project).dot}`}></span>
								<span class="font-semibold">
									{applyBadge(project).title}
								</span>
							</div>

							<div class="flex items-center gap-5 text-sm text-muted-foreground">
								<span class="flex items-center gap-1">
									<Clock class="size-4" />
									{formatHours(hackSecondsByName.get(project.fields.hackatime ?? "") ?? 0)}
								</span>

								<ArrowUpRight
									class="size-5 opacity-60 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
							</div>
						</div>
					</div>
				</button>
			{/each}
		{:else}
			<div class="flex flex-col items-center justify-center gap-6 py-24">
				<p class="text-secondary-foreground">No mixes yet.</p>

				<Button onclick={() => (newProjWindowOpened = true)}>
					<Plus class="mr-2 size-4" />
					Create your first mix
				</Button>
			</div>
		{/if}
	</div>
</main>

<ProjectDialog
	bind:open={newProjWindowOpened}
	mode="create"
	{availableHacks}
	{invalidater}
	onship={async () => false}
	onDelete={() => {}} />

<ProjectDialog
	bind:open={updateProjWindowOpened}
	mode="update"
	project={projectBeingUpdated}
	{availableHacks}
	{idvStatus}
	onship={shipProject}
	{showRotator}
	{invalidater}
	{onDelete} />
