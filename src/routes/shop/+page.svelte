<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte"
	import { ShoppingBag } from "lucide-svelte"
	import { cn } from "$lib/lib/utils"

	let { data } = $props()

	interface Price {
		redstone: number
		glowstone: number
		aqua_regia: number
		potion_mix: number
	}

	type ShopItem = {
		itemID: string
		name: string
		description: string
		price: Price
		image: string
		primaryCurrency: keyof Price | "none"
	}

	function getPrimaryCurrency(price: Price): keyof Price | "none" {
		if (price.redstone > 0) return "redstone"
		if (price.glowstone > 0) return "glowstone"
		if (price.aqua_regia > 0) return "aqua_regia"
		if (price.potion_mix > 0) return "potion_mix"
		return "none"
	}

	const currencyTheme = {
		redstone: {
			border: "border-red-950 group-hover:border-red-500/80",
			shadow: "bg-red-500",
			text: "text-red-400",
			btn: "border-red-800 text-red-400 hover:bg-red-600 hover:text-white",
		},
		glowstone: {
			border: "border-yellow-950 group-hover:border-yellow-500/80",
			shadow: "bg-yellow-500",
			text: "text-yellow-400",
			btn: "border-yellow-800 text-yellow-500 hover:bg-yellow-600 hover:text-black",
		},
		aqua_regia: {
			border: "border-blue-950 group-hover:border-blue-500/80",
			shadow: "bg-blue-900",
			text: "text-blue-400",
			btn: "border-blue-800 text-blue-400 hover:bg-blue-600 hover:text-white",
		},
		potion_mix: {
			border: "border-rose-950 group-hover:border-rose-500/80",
			shadow: "bg-rose-400",
			text: "text-rose-400",
			btn: "border-rose-800 text-rose-400 hover:bg-rose-600 hover:text-white",
		},
		none: {
			border: "border-zinc-800 group-hover:border-primary/80",
			shadow: "shadow-[4px_4px_0px_0px_rgba(var(--primary),0.15)]",
			text: "text-primary",
			btn: "border-zinc-700 text-primary hover:bg-primary hover:text-primary-foreground",
		},
	} as const

	const shopItems: ShopItem[] = data.items
		.map((item: any) => ({
			itemID: item.itemID,
			name: item.name,
			description: item.description,
			price: item.itemPrice,
			image: item.cdnImage,
			primaryCurrency: getPrimaryCurrency(item.itemPrice),
		}))
		.sort((a: any, b: any) => {
			const getPrice = (item: ShopItem) =>
				item.primaryCurrency === "none" ? 0 : item.price[item.primaryCurrency]

			return getPrice(a) - getPrice(b)
		})
</script>

<svelte:head>
	<title>Shop</title>
	<meta name="description" content="Alchemize Shop" />
	<meta property="og:title" content="Shop" />
</svelte:head>

<main
	class="h-screen w-full bg-gradbg text-foreground p-4 md:p-6 font-mono tracking-wide selection:bg-primary selection:text-primary-foreground relative overflow-hidden flex flex-col"
>
	<div class="fixed inset-0 bg-black/20 z-0 pointer-events-none"></div>

	<header
		class="relative z-10 w-full flex flex-col md:flex-row gap-4 items-center justify-between border-b-2 border-zinc-800 pb-4 shrink-0"
	>
		<div class="flex items-center gap-3">
			<ShoppingBag class="h-5 w-5 animate-pulse text-primary" />
			<h1
				class="text-2xl font-alchemize font-black uppercase tracking-wider text-primary [text-shadow:0_2px_10px_rgba(var(--primary),0.2)]"
			>
				The Shop <span
					class="text-[0.6rem] text-zinc-500 tracking-widest block md:inline md:ml-2"
					>Alchemize</span
				>
			</h1>
		</div>
	</header>

	<div
		class="relative z-10 flex-1 overflow-y-auto pr-2 grid gap-4 mt-5 content-start justify-items-center"
		style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));"
	>
		{#each shopItems as item}
			{@const theme = currencyTheme[item.primaryCurrency]}
			<div class="relative group h-full w-full max-w-xs flex flex-col">
				<div
					class={cn(
						"absolute z-0 inset-0 translate-x-0.5 translate-y-0.5 rounded transition-transform group-hover:translate-x-0 group-hover:translate-y-0 opacity-60",
						theme.shadow
					)}
				></div>

				<div
					class={cn(
						"relative z-10 w-full flex flex-col bg-zinc-950/90 border-2 rounded p-3 h-full gap-3 backdrop-blur-sm transition-all",
						theme.border
					)}
				>
					<div
						class="w-full aspect-square bg-zinc-900/60 border border-zinc-800 rounded overflow-hidden relative shrink-0 flex items-center justify-center p-3"
					>
						<img
							src={item.image}
							alt={item.name}
							class="max-w-full max-h-full object-contain transform scale-100 group-hover:scale-[1.05] transition-transform duration-300 relative z-10"
						/>
						<div
							class="absolute inset-0 bg-linear-to-t from-zinc-950/80 via-transparent to-transparent z-0"
						></div>
					</div>

					<div class="flex flex-col flex-1 justify-between gap-2">
						<div class="flex flex-col gap-1">
							<div class="flex items-start justify-between gap-2">
								<h2
									class="text-sm font-black uppercase text-white tracking-tight font-alchemize line-clamp-1"
								>
									{item.name}
								</h2>
							</div>
							<p
								class="text-zinc-400 text-[11px] leading-snug font-mono line-clamp-3"
							>
								{item.description}
							</p>
						</div>

						<div class="pt-2 border-t border-zinc-900/60 w-full mt-auto">
							<Button
								class={cn(
									"w-full h-8 bg-zinc-900/50 hover:bg-zinc-900 text-[11px] font-bold font-sans tracking-wider uppercase rounded transition-all duration-100 border active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
									theme.btn
								)}
							>
								<a href="/"> Login to Purchase </a>
							</Button>
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
</main>
