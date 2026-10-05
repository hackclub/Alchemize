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
	import {
		Blocks,
		ShieldUser,
		ShoppingBasket,
		Users,
		Clock,
		Newspaper,
		ArrowUpRight,
		User as UserIcon,
	} from "lucide-svelte"

	let hacks: HackatimeProject[] = $derived(getHackatimeProjects(data?.hacks))

	let projects: Project[] = $derived(data?.projects ?? [])
	let hackSecondsByName = $derived(
		new Map(
			hacks.map(hack => [
				hack.name ?? hack.project_name ?? hack.project ?? "",
				hack.total_seconds ?? 0,
			])
		)
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

	const isDark = $derived(mode.current === "dark")
</script>

<svelte:head>
	<title>Alchemize | Dashboard</title>
	<meta name="description" content="Alchemize dashboard" />
	<meta property="og:title" content="Alchemize | Dashboard" />
</svelte:head>

<main class=" h-full w-full flex gap-6 p-15">
	<button
		type="button"
		class="absolute top-3 left-3 flex items-center justify-center gap-2 self-center rounded-md border-2 border-primary/40 bg-card px-2 py-1 text-foreground shadow-sm shadow-primary transition-all duration-150 hover:border-primary hover:text-primary"
		onclick={toggleMode}
		aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
		title={isDark ? "Switch to light mode" : "Switch to dark mode"}
	>
		{#if isDark}
			<Sun class="h-4 w-4" /> Light
		{:else}
			<Moon class="h-4 w-4" /> Dark
		{/if}
	</button>
	<div class="flex flex-col gap-6 flex-1 min-h-0">
		<div class="w-full flex items-center justify-start gap-4">
			<div
				class="  w-64 shrink-0 bg-card border border-border/60 px-3 p-2 rounded-tl-2xl rounded-br-2xl rounded-md flex flex-col gap-4 font-note"
			>
				<div class="flex items-center gap-3">
					<img
						src={data.pfp}
						alt={data.name}
						class="size-12 rounded-tl-2xl rounded-br-2xl rounded-md border border-primary"
					/>

					<div class="min-w-0 flex-1">
						<h2
							class="font-display text-card-foreground font-black uppercase tracking-wider leading-none"
						>
							{data.name}
						</h2>

						<p class="text-xs text-muted-foreground truncate mt-1">
							{data.email}
						</p>
					</div>
				</div>

				<div class="border-t border-border/50"></div>

				<div class="flex items-center justify-between">
					<div class="flex flex-col">
						<span
							class="text-[10px] uppercase tracking-widest font-medium text-card-foreground"
						>
							Account
						</span>

						<span class="font-bold text-xs text-muted-foreground">
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
				class="  w-full flex flex-col gap-3 bg-card border border-border/60 p-4 rounded-tl-2xl rounded-br-2xl rounded-md"
			>
				<div class="flex items-center justify-between">
					<h1
						class="font-display font-black text-card-foreground text-md uppercase tracking-wider"
					>
						Your Inventory
					</h1>
				</div>
					<div class="gap-3 grid grid-cols-1 sm:grid-cols-2">
						<div
							class="flex items-center gap-2 bg-secondary/80 border border-border/60 p-2 rounded-tl-2xl rounded-br-2xl rounded-md"
						>
							<div class="p-1 shrink-0 rounded">
								<img
									src="/alch-aquaregia.png"
									alt={CURRENCY_NAME}
									class="w-5 h-5 object-contain"
								/>
							</div>
							<div class="min-w-0">
								<p
									class="text-secondary-foreground text-[9px] uppercase font-bold tracking-wider truncate"
								>
									Balance
								</p>
								<p
									class="font-body font-black text-muted-foreground text-base leading-none mt-0.5"
								>
									{formatAqua(balanceHundredths)}
								</p>
							</div>
						</div>
					</div>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
			<div class="flex flex-col gap-4 flex-1 min-h-0">
				<div
					class="  flex flex-col bg-card border border-border/60 p-5 rounded-tl-2xl rounded-br-2xl rounded-md w-full flex-2 min-h-0"
				>
					<div
						class="flex items-center gap-2 pb-3 shrink-0 border-b border-border/50 mb-3"
					>
						<Blocks class="w-5 h-5 text-card-foreground" />
						<h2
							class="font-display font-black text-card-foreground text-lg uppercase tracking-wider"
						>
							Your Mixes
						</h2>
					</div>

					<div
						class="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-none"
					>
						{#if projects && projects.length > 0}
							{#each projects as project}
								<a href="/dashboard/projects">
									<div
										class="bg-secondary/40 p-4 text-secondary-foreground rounded-tl-2xl rounded-br-2xl rounded-md border border-border/60 hover:border-border/70 transition-colors cursor-pointer flex flex-col justify-between gap-2 group/item shrink-0"
									>
										<div class="flex justify-between items-start gap-4">
											<p
												class="font-alchemize font-bold text-secondary-foreground text-md tracking-wide group-hover/item:text-secondary-foreground/80 transition-colors"
											>
												{project.fields.Name || "Untitled Project"}
											</p>
											<span
												class="text-xs font-bold flex items-center gap-1 shrink-0"
											>
												<Clock class="size-3.5 text-primary" />
												{formatHours(
													hackSecondsByName.get(
														project.fields.hackatime ?? ""
													) ?? 0
												)}hrs
											</span>
										</div>
										<p
											class=" text-xs font-body tracking-normal line-clamp-1 flex gap-2"
										>
											{@html renderBadge(project.fields.Theme)}
										</p>
									</div>
								</a>
							{/each}
						{:else}
							<div class="h-full w-full flex items-center justify-center">
								<a href="/dashboard/projects">
									<Button variant="primary">Create Your first Project!</Button>
								</a>
							</div>
						{/if}
					</div>

					<a
						href="/dashboard/projects"
						class="self-end font-body text-card-foreground font-bold text-md uppercase tracking-widest hover:underline pt-3 flex items-center gap-1 shrink-0"
					>
						All Mixes
					</a>
				</div>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
					<div
						class="  flex flex-col gap-2 bg-card border border-border/60 p-4 rounded-tl-2xl rounded-br-2xl rounded-md justify-center"
					>
						<div class="flex items-center justify-between">
							<p
								class="text-card-foreground text-xs font-bold uppercase tracking-widest flex items-center"
							>
								HCA Configs
								<a
									href="/docs/issues/hca-configs"
									target="_blank"
									rel="noreferrer"
								>
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
							<span
								class="h-2 w-2 rounded-full {data.misconfigured.length === 0
									? 'bg-primary'
									: 'bg-red-700'}"
							></span>
							<span
								class="font-body font-bold uppercase text-xs tracking-wider {data
									.misconfigured.length === 0
									? 'text-primary'
									: 'text-red-700'}"
							>
								{data.misconfigured.length === 0
									? "Complete"
									: data.misconfigured.join(", ") + " Misconfigured"}
							</span>
						</div>
					</div>

					<div
						class="  flex flex-col gap-2 bg-card border border-border/60 p-4 rounded-tl-2xl rounded-br-2xl rounded-md justify-center"
					>
						<p
							class="text-card-foreground text-xs font-bold uppercase tracking-widest"
						>
							YSWS Eligibility
						</p>
						<div class="flex items-center gap-2">
							<span
								class="h-2 w-2 rounded-full {data.eligiblity
									? 'bg-primary'
									: 'bg-red-700'}"
							></span>
							<span
								class="font-body font-bold uppercase text-xs tracking-wider {data.eligiblity
									? 'text-primary'
									: 'text-red-700'}"
							>
								{data.eligiblity ? "Eligible" : "Not Eligible"}
							</span>
						</div>
					</div>
				</div>
			</div>
			<div class="flex flex-col gap-4 flex-1 min-h-0">
				<div
					class="flex flex-col bg-card border border-border/70 p-5
						   rounded-tl-2xl rounded-br-2xl rounded-md
						   flex-2 min-h-0"
				>
					<div
						class="flex items-center justify-between pb-3 shrink-0
							   border-b border-border/50 mb-3"
					>
						<div class="flex items-center gap-2">
							<Newspaper class="size-5 text-primary" />
							<h2
								class="font-display font-black text-card-foreground
									   text-lg uppercase tracking-wider"
							>
								News & Updates
							</h2>
						</div>
					</div>

					<div class="flex-1 overflow-y-auto pr-1 scrollbar-none">
						<div
							class="group border-l-2 border-primary/60
								   bg-secondary/40 p-4 rounded-r-md
								   transition-colors hover:bg-secondary/70"
						>
							<div class="flex items-center justify-between gap-3">
								<span
									class="text-[10px] font-bold text-muted-foreground
										   tracking-widest uppercase"
								>
									unknown
								</span>

								<span
									class="text-[9px] font-bold uppercase tracking-widest
										   text-primary"
								>
									Season 2
								</span>
							</div>

							<h3 class="text-sm font-bold text-secondary-foreground mt-1">
								Alchemize Season 2
							</h3>

							<p
								class="text-secondary-foreground/70 text-xs font-sans
									   mt-1.5 leading-relaxed"
							>
								Alchemize Season 2 is starting soon!!!! Stay tuned!!!
							</p>
						</div>
					</div>
				</div>

				<div class="grid grid-cols-2 grid-rows-2 gap-4 flex-1 min-h-0">
					<a
						href="/refer"
						class="group flex items-center justify-between gap-3 bg-secondary/70 border border-border/60 p-4 rounded-tl-2xl rounded-br-2xl rounded-md transition-all duration-200 hover:bg-secondary hover:border-border/90"
					>
						<div class="flex items-center gap-3 min-w-0">
							<div
								class="size-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center"
							>
								<Users class="size-5 text-primary" />
							</div>

							<div class="min-w-0">
								<h3 class="font-bold text-sm text-secondary-foreground">
									Refer people
								</h3>

								<p class="text-xs text-muted-foreground truncate">
									Invite friends to Alchemize
								</p>
							</div>
						</div>

						<ArrowUpRight
							class="size-4 shrink-0 text-muted-foreground transition-all group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
						/>
					</a>

					<a
						href="/dashboard/shop"
						class="group row-span-2 flex items-center justify-evenly gap-3 bg-secondary/70 border border-border/60 p-4 rounded-tl-2xl rounded-br-2xl rounded-md transition-all duration-200 hover:bg-secondary hover:border-border/90"
					>
						<div class="flex flex-col items-center">
							<h3
								class="font-display font-black uppercase tracking-wider text-lg text-secondary-foreground"
							>
								Shop
							</h3>

							<p class="text-xs text-muted-foreground">
								Browse the Alchemize shop
							</p>
							<div
								class="flex items-center gap-1.5 mt-2 text-xs font-bold uppercase tracking-widest text-primary"
							>
								Explore
								<ArrowUpRight
									class="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
								/>
							</div>
						</div>

						<div
							class="size-15 px-2 py-1 rounded-2xl bg-primary/10 flex items-center justify-center"
						>
							<ShoppingBasket class="size-11 text-primary" />
						</div>
					</a>

					<a
						href="/docs"
						class="group flex items-center justify-between gap-3 bg-secondary/70 border border-border/60 p-4 rounded-tl-2xl rounded-br-2xl rounded-md transition-all duration-200 hover:bg-secondary hover:border-border/90"
					>
						<div class="flex items-center gap-3 min-w-0">
							<div
								class="size-10 shrink-0 rounded-lg bg-primary/10
									   flex items-center justify-center"
							>
								<Newspaper class="size-5 text-primary transition-transform" />
							</div>

							<div class="min-w-0">
								<h3 class="font-bold text-sm text-secondary-foreground">
									Documentation
								</h3>

								<p
									class="text-[11px] text-muted-foreground mt-0.5
										   truncate"
								>
									Learn how everything works
								</p>
							</div>
						</div>

						<ArrowUpRight
							class="size-4 shrink-0 text-muted-foreground
								   transition-all group-hover:text-primary
								   group-hover:translate-x-0.5
								   group-hover:-translate-y-0.5"
						/>
					</a>
				</div>
			</div>
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
