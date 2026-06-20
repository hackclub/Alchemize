<script lang="ts">
	//@ts-ignore
	import looseJson from "loose-json"
	const { data } = $props()

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
</script>

<main
	class="min-h-screen w-full bg-gradbg text-foreground p-4 md:p-10 font-mono tracking-wide selection:bg-primary selection:text-primary-foreground overflow-x-hidden"
>
	<div class="fixed inset-0 bg-black/90/40 z-10"></div>
	<div class="relative z-50 mx-auto flex flex-col gap-8">
		<div
			class="flex justify-between items-end border-b-2 pb-[clamp(5px,1vh,16px)] border-primary/30 h-[clamp(60px,10vh,100px)]"
		>
			<div class="flex items-center gap-4">
				<!-- svelte-ignore a11y_img_redundant_alt -->
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

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start w-full">
			<div class="flex flex-col gap-6 w-full h-full">
				<div class="gap-6 grid grid-cols-1 sm:grid-cols-2 w-full">
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
								Hackatime
							</p>
							<div class="flex items-center gap-2">
								<span
									class="h-2 w-2 rounded-full animate-pulse {data.hackatimeVerified
										? 'bg-emerald-500'
										: 'bg-red-500'}"
								></span>
								<span
									class="font-alchemize font-bold uppercase text-sm tracking-wider {data.hackatimeVerified
										? 'text-emerald-400'
										: 'text-red-400'}"
								>
									{data.hackatimeVerified ? "Connected" : "Not Connected"}
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
									class="h-2 w-2 rounded-full animate-pulse {data.eligiblity
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

				<div class="relative w-full h-full">
					<div
						class="absolute inset-0 bg-primary/40 translate-x-[6px] translate-y-[6px] rounded-md"
					></div>
					<div
						class="relative flex flex-col gap-4 bg-black/90 border-2 border-primary p-5 rounded-md h-full"
					>
						<h2
							class="font-alchemize font-black text-primary text-lg uppercase tracking-wider"
						>
							Recent Mixes
						</h2>

						<div class="flex flex-col flex-1 gap-3 overflow-y-auto pr-1">
							{#each projects as project}
								<div
									class="bg-black/90 p-4 rounded-md hover:border-primary/70 transition-colors cursor-pointer flex flex-col justify-between gap-2 group/item"
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
												hackSecondsByName.get(project.fields.hackatime ?? "") ??
													0
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
						</div>

						<a
							href="/dashboard/projects"
							class="self-end text-primary font-bold text-xs uppercase tracking-widest hover:underline mt-2 flex items-center gap-1"
						>
							View all mixes →
						</a>
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-6 w-full h-full">
				<div class="relative w-full">
					<div
						class="absolute inset-0 bg-primary/40 translate-x-[6px] translate-y-[6px] rounded-md"
					></div>
					<div
						class="relative flex flex-col gap-4 bg-black/90 border-2 border-primary p-5 rounded-md"
					>
						<h2
							class="font-alchemize font-black text-primary text-lg uppercase tracking-wider"
						>
							Quick Actions
						</h2>
						<div class="flex gap-x-4 w-full h-full">
							<div class="gap-4 grid grid-cols-2 w-full">
								<a
									href="/dashboard/projects"
									class="flex flex-col justify-center items-center gap-2 bg-black/90 border-2 border-primary/40 p-4 rounded-md text-zinc-300 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all shadow-[2px_2px_0px_0px_rgba(var(--primary),0.15)] active:translate-x-0.5 active:translate-y-0.5"
								>
									<Blocks class="w-6 h-6 stroke-2" />
									<span
										class="font-alchemize font-bold text-xs uppercase tracking-wider"
										>Projects</span
									>
								</a>

								<a
									href="/dashboard/shop"
									class="flex flex-col justify-center items-center gap-2 bg-black/90 border-2 border-primary/40 p-4 rounded-md text-zinc-300 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all shadow-[2px_2px_0px_0px_rgba(var(--primary),0.15)] active:translate-x-0.5 active:translate-y-0.5"
								>
									<ShoppingBasket class="w-6 h-6 stroke-2" />
									<span
										class="font-alchemize font-bold text-xs uppercase tracking-wider"
										>Shop</span
									>
								</a>

								<a
									href="/dashboard/trade"
									class="flex flex-col justify-center items-center gap-2 bg-black/90 border-2 border-primary/40 p-4 rounded-md text-zinc-300 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all shadow-[2px_2px_0px_0px_rgba(var(--primary),0.15)] active:translate-x-0.5 active:translate-y-0.5"
								>
									<ArrowRightLeft class="w-6 h-6 stroke-2" />
									<span
										class="font-alchemize font-bold text-xs uppercase tracking-wider"
										>Trade</span
									>
								</a>

								<a
									href="/refer"
									class="flex flex-col justify-center items-center gap-2 bg-black/90 border-2 border-primary/40 p-4 rounded-md text-zinc-300 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all shadow-[2px_2px_0px_0px_rgba(var(--primary),0.15)] active:translate-x-0.5 active:translate-y-0.5"
								>
									<Users class="w-6 h-6 stroke-2" />
									<span
										class="font-alchemize font-bold text-xs uppercase tracking-wider"
										>Refer!</span
									>
								</a>
							</div>
							{#if !!data.admin}
								<a
									href="/admin"
									class="flex flex-col justify-center items-center gap-2 bg-black/90 border-2 border-primary/40 p-4 rounded-md text-zinc-300 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all shadow-[2px_2px_0px_0px_rgba(var(--primary),0.15)] active:translate-x-0.5 active:translate-y-0.5 grid-cols-1"
								>
									<ShieldUser class="w-6 h-6 stroke-2" />
									<span
										class="font-alchemize font-bold text-xs uppercase tracking-wider"
										>Admin</span
									>
								</a>
							{/if}
						</div>
					</div>
				</div>

				<div class="relative w-full">
					<div
						class="absolute inset-0 bg-primary/40 translate-x-[6px] translate-y-[6px] rounded-md"
					></div>
					<div
						class="relative flex flex-col gap-4 bg-black/90 border-2 border-primary p-5 rounded-md"
					>
						<h2
							class="font-alchemize font-black text-primary text-lg uppercase tracking-wider"
						>
							Inventory Currencies
						</h2>

						<div class="gap-4 grid grid-cols-2">
							<div
								class="flex items-center gap-3 bg-black/90 border border-primary/20 p-3 rounded-md"
							>
								<div class="bg-black/90 p-1.5 shrink-0 rounded">
									<img
										src="/alch-redstone.png"
										alt="Redstone"
										class="w-6 h-6 object-contain"
									/>
								</div>
								<div class="min-w-0">
									<p
										class="text-zinc-400 text-[10px] uppercase font-bold tracking-wider truncate"
									>
										Redstone
									</p>
									<p
										class="font-alchemize font-black text-white text-lg leading-tight mt-0.5"
									>
										{userCurrencies.redstone ?? 0}
									</p>
								</div>
							</div>

							<div
								class="flex items-center gap-3 bg-black/90 border border-primary/20 p-3 rounded-md"
							>
								<div class="bg-black/90 p-1.5 shrink-0 rounded">
									<img
										src="/alch-glowstone.png"
										alt="Glowstone"
										class="w-6 h-6 object-contain"
									/>
								</div>
								<div class="min-w-0">
									<p
										class="text-zinc-400 text-[10px] uppercase font-bold tracking-wider truncate"
									>
										Glowstone
									</p>
									<p
										class="font-alchemize font-black text-white text-lg leading-tight mt-0.5"
									>
										{userCurrencies.glowstone ?? 0}
									</p>
								</div>
							</div>

							<div
								class="flex items-center gap-3 bg-black/90 border border-primary/20 p-3 rounded-md"
							>
								<div class="bg-black/90 p-1.5 shrink-0 rounded">
									<img
										src="/alch-aquaregia.png"
										alt="Aqua Regia"
										class="w-6 h-6 object-contain"
									/>
								</div>
								<div class="min-w-0">
									<p
										class="text-zinc-400 text-[10px] uppercase font-bold tracking-wider truncate"
									>
										Aqua Regia
									</p>
									<p
										class="font-alchemize font-black text-white text-lg leading-tight mt-0.5"
									>
										{userCurrencies.aqua_regia ?? 0}
									</p>
								</div>
							</div>

							<div
								class="flex items-center gap-3 bg-black/90 border border-primary/20 p-3 rounded-md"
							>
								<div class="bg-black/90 p-1.5 shrink-0 rounded">
									<img
										src="/Alchemize.png"
										alt="Potion Mix"
										class="w-6 h-6 object-contain"
									/>
								</div>
								<div class="min-w-0">
									<p
										class="text-zinc-400 text-[10px] uppercase font-bold tracking-wider truncate"
									>
										Potion Mix
									</p>
									<p
										class="font-alchemize font-black text-white text-lg leading-tight mt-0.5"
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
	</div>
</main>

<style>
	.bg-gradbg {
		background: linear-gradient(
			to bottom right,
			var(--color-neutral-950),
			#1a090c,
			#2e030f
		);
	}
</style>
