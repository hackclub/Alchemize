<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte"
	import { ShoppingBag } from "lucide-svelte"
	import { cn } from "$lib/lib/utils"
	import { formatAqua } from "$lib/currency"

	let { data } = $props()

	type ShopItem = {
		itemID: string
		name: string
		description: string
		priceHundredths: number
		image: string
	}

	const shopItems: ShopItem[] = data.items
		.map((item: any) => ({
			itemID: item.itemID,
			name: item.name,
			description: item.description,
			priceHundredths: item.priceHundredths ?? 0,
			image: item.cdnImage,
		}))
		.sort((a: ShopItem, b: ShopItem) => a.priceHundredths - b.priceHundredths)
</script>

<svelte:head>
	<title>Shop</title>
	<meta name="description" content="Alchemize Shop" />
	<meta property="og:title" content="Shop" />
</svelte:head>

<main class="relative flex h-screen w-full flex-col overflow-hidden px-10 py-6 font-body tracking-wide">
	<header
		class="relative z-10 flex w-full shrink-0 flex-col items-center justify-between gap-4 border-b-2 pb-4 md:flex-row">
		<div class="flex items-center gap-3">
			<ShoppingBag class="h-5 w-5 animate-pulse text-primary" />
			<h1
				class="font-alchemize text-2xl font-black tracking-wider text-primary uppercase [text-shadow:0_2px_10px_rgba(var(--primary),0.2)]">
				The Shop <span class="block text-[0.6rem] tracking-widest text-zinc-500 md:ml-2 md:inline">Alchemize</span>
			</h1>
		</div>
	</header>

	<div
		class="relative z-10 grid min-h-0 flex-1 grid-cols-[repeat(auto-fill,minmax(250px,1fr))] content-start gap-4 overflow-y-auto pt-4 pr-2 pb-6">
		{#each shopItems as item}
			<div
				class={cn(
					"relative z-10 flex h-full w-full flex-col gap-3 rounded border-2 bg-card p-3 backdrop-blur-sm transition-all",
					"shadow-md shadow-blue-700"
				)}>
				<div
					class="relative flex aspect-square w-full shrink-0 items-center justify-center overflow-hidden rounded border bg-background p-3">
					<img
						src={item.image}
						alt={item.name}
						class="relative z-10 max-h-full max-w-full scale-100 transform object-contain transition-transform duration-300 group-hover:scale-[1.05]" />
				</div>

				<div class="flex flex-1 flex-col justify-between gap-2">
					<div class="flex flex-col gap-1">
						<h2 class="line-clamp-1 font-display text-sm font-black tracking-tight text-foreground uppercase">
							{item.name}
						</h2>

						<p class="line-clamp-3 font-body text-[11px] leading-snug text-muted-foreground">
							{item.description}
						</p>
					</div>

					<div class="mt-auto w-full space-y-2 border-t border-border pt-2">
						<p class="text-right font-body text-xs text-card-foreground">
							{formatAqua(item.priceHundredths)}
						</p>

						<Button variant="secondary" class={"w-full"}>
							<a href="/" class="hover:text-primary"> Login to Purchase </a>
						</Button>
					</div>
				</div>
			</div>
		{/each}
	</div>
</main>
