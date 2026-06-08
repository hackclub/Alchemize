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
	} from "lucide-svelte"

	let hacks: HackatimeProject[] = $derived(getHackatimeProjects(data?.hacks))

	let projects: Project[] = $derived(data?.projects ?? [])
	let hackSecondsByName = $derived(
		new Map(
			hacks.map(hack => [
				(hack.name ?? "").trim().toLowerCase(),
				hack.total_seconds ?? 0,
			])
		)
	)
	let userCurrencies = $derived(
		looseJson(data.user?.currency ?? "{}")
	) as UserCurrency
	/**
  {
	"redstone": 0,
	"glowstone": 0,
	"aqua_regia": 0,
	"potion_mix": 0,
	}
 */
</script>

<main
	class="flex gap-4 bg-gradbg p-4 w-screen h-screen overflow-hidden text-foreground"
>
	<div class="-z-10 fixed inset-0 bg-black/60"></div>

	<div class="flex flex-col gap-4 w-full h-full">
		<div
			class="flex justify-between h-[clamp(60px,10vh,100px)] items-center bg-background/40 backdrop-blur px-6 py-4 border border-white/10 rounded-2xl"
		>
			<div class="flex items-center gap-4">
				<img
					alt="Profile Picture"
					src={data.pfp}
					class="bg-primary/40 border rounded-full w-12 h-12"
				/>
				<div>
					<p class="font-alchemize text-foreground text-lg">Hi {data.name}</p>
					<p class="text-muted-foreground text-xs">{data.email}</p>
				</div>
			</div>
			<div
				class="font-hero text-primary text-2xl flex items-center gap-x-4"
			>
				Alchemize
				<img src="/Alchemist.webp" alt="" class="w-10 h-10" />
			</div>
		</div>
		<div class="flex items-start justify-start gap-x-4 h-[]" style="height:calc(calc(100vh - clamp(60px,10vh,100px)) - 2rem)">
			<div
				class="flex flex-col items-center  gap-4 w-[50%] h-full"
			>
				<div class="gap-4 grid grid-cols-2 w-full min-h-1/10">
					<div
						class="flex flex-col gap-2 bg-background/40 backdrop-blur items-start px-5 border py-3 border-white/10 rounded-2xl"
					>
						<p class="text-muted-foreground text-xs uppercase tracking-widest">
							Hackatime
						</p>
						<div class="flex items-center gap-2">
							<div
								class="{data.hackatimeVerified
									? 'bg-green-500'
									: 'bg-red-500'} rounded-full w-2 h-2 animate-pulse"
							></div>
							<span class="font-alchemize text-foreground text-lg"
								>{data.hackatimeVerified ? "Connected" : "Not Connected"}</span
							>
						</div>
					</div>
					<div
						class="flex flex-col gap-2 bg-background/40 backdrop-blur items-start px-5  justify-center border border-white/10 py-3 rounded-2xl"
					>
						<p class="text-muted-foreground text-xs uppercase tracking-widest">
							YSWS
						</p>
						<div class="flex items-center gap-2">
							<div
								class="{data.eligiblity
									? 'bg-green-500'
									: 'bg-red-500'} rounded-full w-2 h-2 animate-pulse"
							></div>
							<span class="font-alchemize text-foreground text-lg"
								>{data.eligiblity ? "Eligible" : "Not Eligible"}</span
							>
						</div>
					</div>
				</div>
				<div class="w-full h-9/10">
					<div
						class="h-full w-full flex flex-col gap-4 bg-background/40 backdrop-blur p-5 border border-white/10 rounded-2xl"
					>
						<h2 class="font-alchemize text-primary text-lg">Recent Projects</h2>
						<div class="flex flex-col flex-1 gap-2 overflow-y-auto">
							{#each projects as project}
								<div
									class="bg-white/5 hover:bg-white/10 p-4 border border-white/5 rounded-xl transition-colors cursor-pointer"
								>
									<p class="font-alchemize text-foreground text-sm">
										{project.fields.Name}
									</p>
									<p class="mt-1 text-muted-foreground text-xs">
										{formatHours(
											hackSecondsByName.get(
												project.fields.hackatime?.trim().toLowerCase()
											) ?? 0
										)} Hours
										<br />
										Last Updated: {new Date(
											project.createdTime
										).toLocaleDateString()}
									</p>
								</div>
							{/each}
						</div>
						<a
							href="/dashboard/projects"
							class="self-end text-primary text-xs hover:underline"
							>View all →</a
						>
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-5 h-full w-[50%]">
				<div
					class="flex flex-col flex-1 gap-3 bg-background/40 backdrop-blur p-5 border border-white/10 rounded-2xl"
				>
					<h2 class="font-alchemize text-primary text-xl">Quick Actions</h2>
					<div class="gap-2 grid grid-cols-2">
						<a
							href="/dashboard/projects"
							class="flex flex-col justify-center items-center gap-2 bg-white/5 hover:bg-primary/20 p-4 border border-white/10 hover:border-primary/50 rounded-xl transition-all"
						>
							<Blocks class="w-7 h-7 font-extralight" />
							<span class="font-alchemize text-foreground text-sm">
								Projects
							</span>
						</a>
						<a
							href="/dashboard/shop"
							class="flex flex-col justify-center items-center gap-2 bg-white/5 hover:bg-primary/20 p-4 border border-white/10 hover:border-primary/50 rounded-xl transition-all"
						>
							<ShoppingBasket class="w-7 h-7 font-extralight" />
							<span class="font-alchemize text-foreground text-sm">Shop</span>
						</a>
						<a
							href="/dashboard/trade"
							class="flex flex-col justify-center items-center gap-2 bg-white/5 hover:bg-primary/20 p-4 border border-white/10 hover:border-primary/50 rounded-xl transition-all"
						>
							<ArrowRightLeft class="w-7 h-7 font-extralight" />
							<span class="font-alchemize text-foreground text-sm">
								Trade
							</span>
						</a>
						<a
							href="/refer"
							class="flex flex-col justify-center items-center gap-2 bg-white/5 hover:bg-primary/20 p-4 border border-white/10 hover:border-primary/50 rounded-xl transition-all"
						>
							<Users class="w-7 h-7 font-extralight" />
							<span class="font-alchemize text-foreground text-sm">
								Refer!
							</span>
						</a>
						{#if data.admin || true}
							<a
								href="/admin"
								class="flex flex-col justify-center items-center gap-2 bg-white/5 hover:bg-primary/20 p-4 border border-white/10 hover:border-primary/50 rounded-xl transition-all"
							>
								<ShieldUser class="w-7 h-7 font-extralight" />
								<span class="font-alchemize text-foreground text-sm">
									Admin
								</span>
							</a>
						{/if}
					</div>
				</div>

				<div
					class="flex flex-col gap-2 bg-background/40 backdrop-blur p-5 border border-white/10 rounded-2xl"
				>
					<h2 class="font-alchemize text-primary text-lg">Currency</h2>
					<div class="gap-2 flex justify-around">
						<div class="flex items-center gap-2">
							<span class="text-lg"
								><img
									src="/alch-redstone.png"
									alt="Redstone"
									class="w-5 h-5"
								/></span
							>
							<div>
								<p class="text-muted-foreground text-xs">Redstone</p>
								<p class="font-alchemize text-foreground">
									{userCurrencies.redstone}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<span class="text-lg"
								><img
									src="/alch-glowstone.png"
									alt="Glowstone"
									class="w-5 h-5"
								/></span
							>
							<div>
								<p class="text-muted-foreground text-xs">Glowstone</p>
								<p class="font-alchemize text-foreground">
									{userCurrencies.glowstone}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<span class="text-lg"
								><img
									src="/alch-aquaregia.png"
									alt="Aqua Regia"
									class="w-5 h-5"
								/></span
							>
							<div>
								<p class="text-muted-foreground text-xs">Aqua Regia</p>
								<p class="font-alchemize text-foreground">
									{userCurrencies.aqua_regia}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<span class="text-lg"
								><img
									src="/Alchemize.png"
									alt="Potion Mix"
									class="w-5 h-5"
								/></span
							>
							<div>
								<p class="text-muted-foreground text-xs">Potion Mix</p>
								<p class="font-alchemize text-foreground">
									{userCurrencies.potion_mix}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</main>
