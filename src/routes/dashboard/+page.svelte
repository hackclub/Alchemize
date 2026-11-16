<script lang="ts">
	const { data } = $props()
	import { CircleQuestionMark, Moon, Sun } from "@lucide/svelte"
	import { Button } from "$lib/components/ui/button"
	type HackatimeProject = {
		name?: string
		project_name?: string
		project?: string
		total_seconds?: number
	}
	import { mode, toggleMode } from "mode-watcher"
	import { IDV_SUBMIT_URL, type IdvStatus } from "$lib/idv"

	const IDV_BADGES: Record<IdvStatus, { label: string; dot: string; text: string }> = {
		verified: { label: "Eligible", dot: "bg-primary", text: "text-primary" },
		needs_submission: { label: "Verification needed", dot: "bg-amber-500", text: "text-amber-300" },
		pending: { label: "Verification pending", dot: "bg-amber-500", text: "text-amber-300" },
		ineligible: { label: "Not Eligible", dot: "bg-red-700", text: "text-red-300" },
		unavailable: { label: "Couldn't check", dot: "bg-muted-foreground", text: "text-muted-foreground" },
	}
	const idvBadge = $derived(IDV_BADGES[data.idvStatus as IdvStatus] ?? IDV_BADGES.unavailable)

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
			Theme: string
		}
	}

	import { CURRENCY_NAME, formatAqua } from "$lib/currency"
	import { formatHours, getHackatimeProjects } from "$lib/utils"
	import { Blocks, ShieldUser, ShoppingBasket, Users, Clock, Newspaper, ArrowUpRight, User } from "lucide-svelte"

	let hacks: HackatimeProject[] = $derived(getHackatimeProjects(data?.hacks))

	let projects: Project[] = $derived(data?.projects ?? [])
	let hackSecondsByName = $derived(
		new Map(hacks.map(hack => [hack.name ?? hack.project_name ?? hack.project ?? "", hack.total_seconds ?? 0]))
	)
	let balanceHundredths: number = $derived(
		Number((data.user as { balanceHundredths?: number } | undefined)?.balanceHundredths ?? 0) || 0
	)

	const renderBadge = (text: string) => {
		switch (text?.toLowerCase()) {
			case "endless":
				return "<img src='/alch-aquaregia.png' alt='Aqua Regia' class='w-4 h-4 object-contain' /> Endless"
			case "no-internet":
				return "<img src='/alch-glowstone.png' alt='Glowstone' class='w-4 h-4 object-contain' /> No Internet"
			case "indie-gamedev":
				return "<img src='/alch-redstone.png' alt='Redstone' class='w-4 h-4 object-contain' /> Indie Game Dev"
			case "potion mix":
				return "<img src='/pmix_v2.png' alt='Potion Mix' class='w-5 h-5 object-contain' /> Potion Mix"
			default:
				return null
		}
	}
</script>

<svelte:head>
	<title>Alchemize | Dashboard</title>
	<meta name="description" content="Alchemize dashboard" />
	<meta property="og:title" content="Alchemize | Dashboard" />
</svelte:head>

<main class="flex h-full w-full gap-6 p-15 font-note">
	<div class="flex min-h-0 flex-1 flex-col gap-6">
		<div class="grid w-full shrink-0 grid-cols-2 items-stretch gap-4">
			<div
				class="flex w-full min-w-0 flex-col gap-4 rounded-md rounded-tl-2xl rounded-br-2xl border border-border/60 bg-card p-3 px-3 font-note">
				<div class="flex items-center gap-3">
					<img
						src={data.pfp}
						alt={data.name}
						class="size-12 rounded-md rounded-tl-2xl rounded-br-2xl border border-primary" />

					<div class="min-w-0 flex-1">
						<h2 class="font-note leading-none font-black tracking-wider text-card-foreground uppercase">
							{data.name}
						</h2>

						<p class="mt-1 truncate text-xs text-muted-foreground">
							{data.email}
						</p>
					</div>
				</div>

				<div class="border-t border-border/50"></div>

				<div class="flex items-center justify-between">
					<div class="flex flex-col">
						<span class="text-[10px] font-medium tracking-widest text-card-foreground uppercase"> Account </span>

						<span class="text-xs font-bold text-muted-foreground">
							{data.admin ? "Admin" : "Participant"}
						</span>
					</div>

					{#if data.admin}
						<a href="/admin">
							<Button variant="secondary" size="xs">
								<ShieldUser />
								Admin
							</Button>
						</a>
					{/if}
				</div>
			</div>

			<div
				class="flex w-full min-w-0 flex-col gap-2 rounded-md rounded-tl-2xl rounded-br-2xl border border-border/60 bg-card p-4">
				<h1
					class="font-note text-sm font-black
			       tracking-wider text-card-foreground uppercase">
					Your Inventory
				</h1>

				<div
					class="flex max-w-sm flex-1 items-center gap-3 rounded-md
		       rounded-tl-xl rounded-br-xl border border-border/60 bg-secondary/60
		       p-3">
					<img src="/alch-aquaregia.png" alt={CURRENCY_NAME} class="h-7 w-7 shrink-0 object-contain" />

					<div class="flex min-w-0 flex-1 flex-col">
						<p
							class="text-[10px] font-bold tracking-wider text-muted-foreground
				       uppercase">
							Aqua Regia
						</p>
						<p
							class="mt-0.5 font-body text-base
				       leading-tight font-bold text-card-foreground">
							{formatAqua(balanceHundredths)}
						</p>
					</div>
				</div>
			</div>
		</div>

		<div class="flex min-h-0 flex-1 flex-col gap-4">
			<div
				class="  flex min-h-0 w-full flex-2 flex-col rounded-md rounded-tl-2xl rounded-br-2xl border border-border/60 bg-card p-5">
				<div class="mb-3 flex shrink-0 items-center gap-2 border-b border-border/50 pb-3">
					<Blocks class="h-5 w-5 text-card-foreground" />
					<h2 class="font-note text-lg font-black tracking-wider text-card-foreground uppercase">Your Mixes</h2>
				</div>

				<div class="flex flex-1 scrollbar-none flex-col gap-3 overflow-y-auto pr-1">
					{#if projects && projects.length > 0}
						{#each projects as project}
							<a href="/dashboard/projects">
								<div
									class="group/item flex shrink-0 cursor-pointer flex-col justify-between gap-2 rounded-md rounded-tl-2xl rounded-br-2xl border border-border/60 bg-secondary/40 p-4 text-secondary-foreground transition-colors hover:border-border/70">
									<div class="flex items-start justify-between gap-4">
										<p
											class="text-md font-alchemize font-bold tracking-wide text-secondary-foreground transition-colors group-hover/item:text-secondary-foreground/80">
											{project.fields.Name || "Untitled Project"}
										</p>
										<span class="flex shrink-0 items-center gap-1 text-xs font-bold">
											<Clock class="size-3.5 text-primary" />
											{formatHours(hackSecondsByName.get(project.fields.hackatime ?? "") ?? 0)}hrs
										</span>
									</div>
									<p class=" line-clamp-1 flex gap-2 font-body text-xs tracking-normal">
										{@html renderBadge(project.fields.Theme)}
									</p>
								</div>
							</a>
						{/each}
					{:else}
						<div class="flex h-full w-full items-center justify-center">
							<a href="/dashboard/projects">
								<Button variant="primary">Create Your first Project!</Button>
							</a>
						</div>
					{/if}
				</div>

				<a
					href="/dashboard/projects"
					class="text-md flex shrink-0 items-center gap-1 self-end pt-3 font-note font-bold tracking-widest text-card-foreground uppercase hover:underline">
					All Mixes
				</a>
			</div>
			<div class="grid shrink-0 grid-cols-1 gap-6 md:grid-cols-2">
				<div
					class="  flex flex-col justify-center gap-2 rounded-md rounded-tl-2xl rounded-br-2xl border border-border/60 bg-card p-4">
					<div class="flex items-center justify-between">
						<p class="flex items-center font-note text-xs font-bold tracking-wide text-card-foreground uppercase">
							HCA Configs
							<a href="/docs/issues/hca-configs" target="_blank" rel="noreferrer">
								<CircleQuestionMark class="ml-1.5 size-3" />
							</a>
						</p>
						{#if data.misconfigured.length > 0}
							<a href="/auth">
								<Button variant="primary">Re-login</Button>
							</a>
						{/if}
					</div>
					<div class="flex items-center gap-2">
						<span class="h-2 w-2 rounded-full {data.misconfigured.length === 0 ? 'bg-primary' : 'bg-red-700'}"></span>
						<span
							class="font-body text-xs font-bold tracking-wider uppercase {data.misconfigured.length === 0
								? 'text-primary'
								: 'text-red-300'}">
							{data.misconfigured.length === 0 ? "Complete" : data.misconfigured.join(", ") + " Misconfigured"}
						</span>
					</div>
				</div>

				<div
					class="  flex flex-col justify-center gap-2 rounded-md rounded-tl-2xl rounded-br-2xl border border-border/60 bg-card p-4">
					<p class="font-note text-xs font-bold tracking-wide text-card-foreground uppercase">YSWS Eligibility</p>
					<div class="flex items-center gap-2">
						<span class="h-2 w-2 rounded-full {idvBadge.dot}"></span>
						<span class="font-body text-xs font-bold tracking-wider uppercase {idvBadge.text}">
							{idvBadge.label}
						</span>
					</div>
					{#if data.idvStatus === "needs_submission"}
						<a
							href={IDV_SUBMIT_URL}
							target="_blank"
							rel="noopener noreferrer"
							class="font-body text-xs text-foreground underline underline-offset-2 hover:text-primary">
							Verify your identity to ship projects
						</a>
					{/if}
				</div>
			</div>
		</div>
	</div>
	<div class="flex min-h-0 flex-[1.4] flex-col gap-4">
		<div
			class="flex min-h-0 flex-2 flex-col rounded-md rounded-tl-2xl
						   rounded-br-2xl border border-border/70
						   bg-card p-5">
			<div
				class="mb-3 flex shrink-0 items-center justify-between
							   border-b border-border/50 pb-3">
				<div class="flex items-center gap-2">
					<Newspaper class="size-5 text-primary" />
					<h2
						class="font-note text-lg font-black
									   tracking-wider text-card-foreground uppercase">
						News & Updates
					</h2>
				</div>
			</div>

			<div class="flex-1 scrollbar-none overflow-y-auto pr-1">
				<div
					class="group rounded-r-md border-l-2
								   border-primary/60 bg-secondary/40 p-4
								   transition-colors hover:bg-secondary/70">
					<div class="flex items-center justify-between gap-3">
						<span
							class="font-display text-[10px] font-bold tracking-widest
										   text-muted-foreground uppercase">
							16th October 2026
						</span>

						<span
							class="text-[9px] font-bold tracking-widest text-primary
										   uppercase">
							Season 2
						</span>
					</div>

					<h3 class="mt-1 text-sm font-bold text-secondary-foreground">Alchemize Season 2</h3>

					<p
						class="mt-1.5 font-sans text-xs
									   leading-relaxed text-secondary-foreground/70">
						Alchemize Season 2 is starting soon!!!! Stay tuned!!!
					</p>
				</div>
			</div>
		</div>

		<div class="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-4">
			<a
				href="/refer"
				class="group flex items-center justify-between gap-3 rounded-md rounded-tl-2xl rounded-br-2xl border border-border/60 bg-secondary/70 p-4 transition-all duration-200 hover:border-border/90 hover:bg-secondary">
				<div class="flex min-w-0 items-center gap-3">
					<div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
						<Users class="size-5 text-primary" />
					</div>

					<div class="min-w-0">
						<h3 class="font-note text-sm font-bold text-secondary-foreground">Refer people</h3>

						<p class="truncate text-xs text-muted-foreground">Invite friends to Alchemize</p>
					</div>
				</div>

				<ArrowUpRight
					class="size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
			</a>

			<a
				href="/dashboard/shop"
				class="group row-span-2 flex items-center justify-evenly gap-3 rounded-md rounded-tl-2xl rounded-br-2xl border border-border/60 bg-secondary/70 p-4 transition-all duration-200 hover:border-border/90 hover:bg-secondary">
				<div class="flex flex-col items-center">
					<h3 class="font-note text-lg font-black tracking-wider text-secondary-foreground uppercase">Shop</h3>

					<p class="text-xs text-muted-foreground">Browse the Alchemize shop</p>
					<div class="mt-2 flex items-center gap-1.5 text-xs font-bold tracking-widest text-primary uppercase">
						Explore
						<ArrowUpRight
							class="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
					</div>
				</div>

				<div class="flex size-15 items-center justify-center rounded-2xl bg-primary/10 px-2 py-1">
					<ShoppingBasket class="size-11 text-primary" />
				</div>
			</a>

			<a
				href="/docs"
				class="group flex items-center justify-between gap-3 rounded-md rounded-tl-2xl rounded-br-2xl border border-border/60 bg-secondary/70 p-4 transition-all duration-200 hover:border-border/90 hover:bg-secondary">
				<div class="flex min-w-0 items-center gap-3">
					<div
						class="flex size-10 shrink-0 items-center
									   justify-center rounded-lg bg-primary/10">
						<Newspaper class="size-5 text-primary transition-transform" />
					</div>

					<div class="min-w-0">
						<h3 class="font-note text-sm font-bold text-secondary-foreground">Documentation</h3>

						<p class="mt-0.5 truncate text-[11px] text-muted-foreground">Learn how everything works</p>
					</div>
				</div>

				<ArrowUpRight
					class="size-4 shrink-0 text-muted-foreground
								   transition-all group-hover:translate-x-0.5
								   group-hover:-translate-y-0.5
								   group-hover:text-primary" />
			</a>
		</div>
	</div>
</main>

<style>
	:global(.scrollbar-none::-webkit-scrollbar) {
		display: none;
	}
	:global(.scrollbar-none) {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
