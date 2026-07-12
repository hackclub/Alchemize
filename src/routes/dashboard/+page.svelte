<script lang="ts">
	//@ts-ignore
	import looseJson from "loose-json"
	const { data } = $props()
	import { CircleQuestionMark } from "@lucide/svelte"
	import { Button } from "$lib/components/ui/button"
	type HackatimeProject = {
		name?: string
		project_name?: string
		project?: string
		total_seconds?: number
	}

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

	import type { UserCurrency } from "$lib/types"
	import { formatHours, getHackatimeProjects } from "$lib/utils"
	import {
		ArrowRightLeft,
		Blocks,
		ShieldUser,
		ShoppingBasket,
		Users,
		Clock,
		Newspaper,
	} from "lucide-svelte"
	import { Compass } from "@lucide/svelte"

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
	let userCurrencies = $derived(
		looseJson(data.user?.currency ?? "{}")
	) as UserCurrency
	const renderBadge = (text: string) => {
		switch (text.toLowerCase()) {
			case "endless":
				return "<img src='/alch-aquaregia.png' alt='Aqua Regia' class='w-4 h-4 object-contain' /> Endless"
			case "no-internet":
				return "<img src='/alch-glowstone.png' alt='Glowstone' class='w-4 h-4 object-contain' /> No Internet"
			case "indie-gamedev":
				return "<img src='/alch-redstone.png' alt='Redstone' class='w-4 h-4 object-contain' /> Indie Game Dev"
			case "potion mix":
				return "<img src='/Alchemize.png' alt='Potion Mix' class='w-4 h-4 object-contain' /> Potion Mix"
			default:
				return null
		}
	}

	const navItems = [
		{ href: "/dashboard/projects", label: "Projects", icon: Blocks },
		// { href: "/dashboard/explore", label: "Explore", icon: Compass },
		{ href: "/dashboard/shop", label: "Shop", icon: ShoppingBasket },
		{ href: "/dashboard/trade", label: "Trade", icon: ArrowRightLeft },
		{ href: "/refer", label: "Refer!", icon: Users },
		{ href: "/docs", label: "Docs", icon: Newspaper },
	]
</script>

<svelte:head>
	<title>Alchemize | Dashboard</title>
	<meta name="description" content="Alchemize dashboard" />
	<meta property="og:title" content="Alchemize | Dashboard" />
</svelte:head>

<div
	class="h-screen w-full bg-gradbg text-foreground font-mono tracking-wide selection:bg-primary selection:text-primary-foreground relative flex flex-col overflow-hidden p-4 md:p-6 lg:p-8 gap-4 md:gap-6"
>
	<main
		class="flex-1 min-h-0 relative z-20 w-full mx-auto max-w-7xl flex flex-col gap-6"
	>
		<div
			class="flex justify-between items-end border-b-2 pb-3 border-primary/30 shrink-0"
		>
			<div class="flex items-center gap-4">
				<img
					alt="Profile Picture"
					src={data.pfp}
					class="border-2 border-primary bg-black/90 w-12 h-12 rounded-md shadow-[2px_2px_0px_0px_rgba(var(--primary),0.3)]"
				/>
				<div>
					<h1
						class="font-alchemize text-primary text-xl font-black uppercase tracking-wider"
					>
						{data.name}
					</h1>
					<p class="text-zinc-400 text-xs font-sans tracking-normal">
						{data.email}
					</p>
				</div>
			</div>
			<div
				class="font-alchemize font-black uppercase tracking-widest leading-none text-primary text-2xl flex items-center gap-x-1"
			>
				Alchemize
			</div>
		</div>

		<div
			class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch w-full flex-1 min-h-0"
		>
			<div class="flex flex-col gap-6 w-full min-h-0">
				<div class="gap-6 grid grid-cols-1 sm:grid-cols-2 w-full shrink-0">
					<div class="relative group">
						<div
							class="absolute inset-0 bg-primary/20 translate-x-[4px] translate-y-[4px] rounded-md"
						></div>
						<div
							class="relative flex flex-col gap-2 bg-black/90 border-2 border-primary/80 p-4 rounded-md"
						>
							<p
								class="text-zinc-400 text-[10px] font-bold uppercase tracking-widest flex items-center"
							>
								HCA Configs <a href="/docs/issues/hca-configs" target="_blank"
									><CircleQuestionMark class="ml-2 size-3" /></a
								>
								{#if data.misconfigured.length > 0}<a href="/auth"
										><Button
											class="bg-primary px-1 h-6 ml-3 text-xs tracking-tight"
											>Re-login</Button
										></a
									>
								{/if}
							</p>
							<div class="flex items-center gap-2">
								<span
									class="h-2 w-2 rounded-full {data.misconfigured.length === 0
										? 'bg-emerald-500'
										: 'bg-red-500'}"
								></span>
								<span
									class="font-alchemize font-bold uppercase text-sm tracking-wider {data
										.misconfigured.length === 0
										? 'text-emerald-400'
										: 'text-red-400'}"
								>
									{data.misconfigured.length === 0
										? "Complete"
										: data.misconfigured.join(", ") + " Misconfigured"}
								</span>
							</div>
						</div>
					</div>

					<div class="relative group">
						<div
							class="absolute inset-0 bg-primary/20 translate-x-[4px] translate-y-[4px] rounded-md"
						></div>
						<div
							class="relative flex flex-col gap-2 bg-black/90 border-2 border-primary/80 p-4 rounded-md"
						>
							<p
								class="text-zinc-400 text-[10px] font-bold uppercase tracking-widest"
							>
								YSWS Eligibility
							</p>
							<div class="flex items-center gap-2">
								<span
									class="h-2 w-2 rounded-full {data.eligiblity
										? 'bg-emerald-500'
										: 'bg-red-500'}"
								></span>
								<span
									class="font-alchemize font-bold uppercase text-sm tracking-wider {data.eligiblity
										? 'text-emerald-400'
										: 'text-red-400'}"
								>
									{data.eligiblity ? "Eligible" : "Not Eligible"}
								</span>
							</div>
						</div>
					</div>
				</div>

				<div class="relative w-full flex-1 min-h-0">
					<div
						class="absolute inset-0 bg-primary/40 translate-x-[6px] translate-y-[6px] rounded-md"
					></div>
					<div
						class="relative flex flex-col bg-black/90 border-2 border-primary p-5 rounded-md h-full min-h-0"
					>
						<div class="flex items-center gap-2 pb-3 shrink-0">
							<Newspaper class="w-5 h-5 text-primary" />
							<h2
								class="font-alchemize font-black text-primary text-lg uppercase tracking-wider"
							>
								News & Updates
							</h2>
						</div>
						<div
							class="flex-1 overflow-y-auto pr-1 text-zinc-400 text-sm no-scrollbar"
						>
							<div
								class="flex flex-col gap-3 max-h-[190px] overflow-y-auto pr-1"
							>
								<div
									class="border-l-2 border-white bg-zinc-950/50 p-3 rounded-r-md"
								>
									<span
										class="text-[9px] font-bold text-zinc-500 tracking-widest uppercase"
										>July 9th 2026</span
									>
									<h3 class="text-xs font-bold text-zinc-300 mt-0.5">
										Fulfillment updates
									</h3>
									<p
										class="text-zinc-500 text-[11px] font-sans mt-1 leading-relaxed"
									>
										Fulfillment has started! Now go buy some stuff from the
										shop!
									</p>
								</div>
								<div
									class="border-l-2 border-primary/40 bg-zinc-950/50 p-3 rounded-r-md"
								>
									<span
										class="text-[9px] font-bold text-primary tracking-widest uppercase"
										>June 24th 2026</span
									>
									<h3 class="text-xs font-bold text-zinc-200 mt-0.5">
										Shop Suggestions!
									</h3>
									<p
										class="text-zinc-400 text-[11px] font-sans mt-1 leading-relaxed"
									>
										Go suggest new items to be added to the shop every week from
										the <a
											href="/dashboard/shop"
											class="font-bold text-primary italic"
										>
											shop
										</a> page!
									</p>
								</div>
							</div>
							<!-- No news or updates currently.... -->
						</div>
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-6 w-full min-h-0">
				<div class="relative w-full flex-1 min-h-0">
					<div
						class="absolute inset-0 bg-primary/40 translate-x-[6px] translate-y-[6px] rounded-md"
					></div>
					<div
						class="relative flex flex-col bg-black/90 border-2 border-primary p-5 rounded-md h-full min-h-0"
					>
						<h2
							class="font-alchemize font-black text-primary text-lg uppercase tracking-wider pb-3 shrink-0"
						>
							Recent Mixes
						</h2>

						<div
							class="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 no-scrollbar"
						>
							{#if projects}
								{#each projects as project}
									<div
										class="bg-background/40 p-4 rounded-md border border-primary hover:border-primary/70 transition-colors cursor-pointer flex flex-col justify-between gap-2 group/item shrink-0"
									>
										<div class="flex justify-between items-start gap-4">
											<p
												class="font-alchemize font-bold text-white text-sm tracking-wide group-hover/item:text-primary transition-colors"
											>
												{project.fields.Name || "Untitled Project"}
											</p>
											<span
												class="text-[11px] font-bold text-zinc-400 flex items-center gap-1 shrink-0"
											>
												<Clock class="size-3.5 text-primary" />
												{formatHours(
													hackSecondsByName.get(
														project.fields.hackatime ?? ""
													) ?? 0
												)}h
											</span>
										</div>
										<p
											class="text-zinc-500 text-[11px] font-sans tracking-normal line-clamp-1 flex gap-2"
										>
											{@html renderBadge(project.fields.Theme) ??
												project.fields.type}
										</p>
									</div>
								{/each}
							{:else}
								<div>No projects yet.....</div>
							{/if}
						</div>

						<a
							href="/dashboard/projects"
							class="self-end text-primary font-bold text-xs uppercase tracking-widest hover:underline pt-2 flex items-center gap-1 shrink-0"
						>
							View all mixes →
						</a>
					</div>
				</div>

				<div class="relative w-full shrink-0">
					<div
						class="absolute inset-0 bg-primary/40 translate-x-[4px] translate-y-[4px] rounded-md"
					></div>
					<div
						class="relative flex flex-col gap-3 bg-black/90 border-2 border-primary p-4 rounded-md"
					>
						<h2
							class="font-alchemize font-black text-primary text-sm uppercase tracking-wider"
						>
							Inventory Currencies
						</h2>
						<div class="gap-3 grid grid-cols-2">
							<div
								class="flex items-center gap-2 bg-black/90 border border-primary/20 p-2 rounded-md"
							>
								<div class="bg-black/90 p-1 shrink-0 rounded">
									<img
										src="/alch-redstone.png"
										alt="Redstone"
										class="w-5 h-5 object-contain"
									/>
								</div>
								<div class="min-w-0">
									<p
										class="text-zinc-400 text-[9px] uppercase font-bold tracking-wider truncate"
									>
										Redstone
									</p>
									<p
										class="font-alchemize font-black text-white text-base leading-none mt-0.5"
									>
										{userCurrencies.redstone ?? 0}
									</p>
								</div>
							</div>
							<div
								class="flex items-center gap-2 bg-black/90 border border-primary/20 p-2 rounded-md"
							>
								<div class="bg-black/90 p-1 shrink-0 rounded">
									<img
										src="/alch-glowstone.png"
										alt="Glowstone"
										class="w-5 h-5 object-contain"
									/>
								</div>
								<div class="min-w-0">
									<p
										class="text-zinc-400 text-[9px] uppercase font-bold tracking-wider truncate"
									>
										Glowstone
									</p>
									<p
										class="font-alchemize font-black text-white text-base leading-none mt-0.5"
									>
										{userCurrencies.glowstone ?? 0}
									</p>
								</div>
							</div>
							<div
								class="flex items-center gap-2 bg-black/90 border border-primary/20 p-2 rounded-md"
							>
								<div class="bg-black/90 p-1 shrink-0 rounded">
									<img
										src="/alch-aquaregia.png"
										alt="Aqua Regia"
										class="w-5 h-5 object-contain"
									/>
								</div>
								<div class="min-w-0">
									<p
										class="text-zinc-400 text-[9px] uppercase font-bold tracking-wider truncate"
									>
										Aqua Regia
									</p>
									<p
										class="font-alchemize font-black text-white text-base leading-none mt-0.5"
									>
										{userCurrencies.aqua_regia ?? 0}
									</p>
								</div>
							</div>
							<div
								class="flex items-center gap-2 bg-black/90 border border-primary/20 p-2 rounded-md"
							>
								<div class="bg-black/90 p-1 shrink-0 rounded">
									<img
										src="/Alchemize.png"
										alt="Potion Mix"
										class="w-5 h-5 object-contain"
									/>
								</div>
								<div class="min-w-0">
									<p
										class="text-zinc-400 text-[9px] uppercase font-bold tracking-wider truncate"
									>
										Potion Mix
									</p>
									<p
										class="font-alchemize font-black text-white text-base leading-none mt-0.5"
									>
										{userCurrencies.potion_mix ?? 0}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</main>

	<div class="w-full relative z-30 flex justify-center shrink-0">
		<div
			class="w-full md:w-[95%] max-w-5xl bg-black/90 border-2 border-primary/60 backdrop-blur-md px-4 py-3 md:px-10 rounded-xl"
		>
			<div class="mx-auto flex items-center justify-between gap-2 sm:gap-4">
				<div
					class="flex items-center gap-1 sm:gap-3 overflow-x-auto no-scrollbar w-full"
				>
					{#each navItems as item}
						<a
							href={item.href}
							class="flex items-center gap-2 bg-black border-2 border-primary/30 px-3 py-2 rounded text-zinc-300 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all shadow-[2px_2px_0px_0px_rgba(var(--primary),0.1)] active:translate-x-0.5 active:translate-y-0.5 shrink-0"
						>
							<svelte:component this={item.icon} class="w-4 h-4 stroke-2" />
							<span
								class="font-alchemize font-bold text-[11px] uppercase tracking-wider hidden sm:inline"
								>{item.label}</span
							>
						</a>
					{/each}

					{#if !!data.admin}
						<a
							href="/admin"
							class="flex items-center gap-2 bg-black border-2 border-red-500/30 px-3 py-2 rounded text-zinc-300 hover:text-red-400 hover:border-red-500 hover:bg-red-500/5 transition-all shadow-[2px_2px_0px_0px_rgba(239,68,68,0.1)] active:translate-x-0.5 active:translate-y-0.5 shrink-0"
						>
							<ShieldUser class="w-4 h-4 stroke-2 text-red-500" />
							<span
								class="font-alchemize font-bold text-[11px] uppercase tracking-wider hidden sm:inline"
								>Admin</span
							>
						</a>
					{/if}
				</div>
				<div
					class="font-alchemize font-black uppercase text-xs tracking-widest text-primary/60 hidden md:block select-none shrink-0 pl-4"
				>
					Quick Actions
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.bg-gradbg {
		background: linear-gradient(
			to bottom right,
			var(--color-neutral-950),
			#1a090c,
			#2e030f
		);
	}

	:global(.no-scrollbar::-webkit-scrollbar) {
		display: none;
	}
	:global(.no-scrollbar) {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
