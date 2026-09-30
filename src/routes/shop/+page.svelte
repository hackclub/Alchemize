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

<main
	class="h-screen w-full px-10 py-6 tracking-wide relative overflow-hidden flex flex-col font-body"
>
	<header
		class="relative z-10 w-full flex flex-col md:flex-row gap-4 items-center justify-between border-b-2 pb-4 shrink-0"
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
		class="relative z-10 flex-1 min-h-0 overflow-y-auto pr-2 pt-4 pb-6 grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4 content-start"
	>
		{#each shopItems as item}
			<div
				class={cn(
					"relative z-10 w-full flex flex-col bg-card border-2 rounded p-3 h-full gap-3 backdrop-blur-sm transition-all",
					"shadow-md shadow-blue-700"
				)}
			>
				<div
					class="w-full aspect-square border bg-background rounded overflow-hidden relative shrink-0 flex items-center justify-center p-3"
				>
					<img
						src={item.image}
						alt={item.name}
						class="max-w-full max-h-full object-contain transform scale-100 group-hover:scale-[1.05] transition-transform duration-300 relative z-10"
					/>
				</div>

				<div class="flex flex-col flex-1 justify-between gap-2">
					<div class="flex flex-col gap-1">
						<h2
							class="text-sm font-display font-black uppercase text-foreground tracking-tight line-clamp-1"
						>
							{item.name}
						</h2>

						<p
							class="text-muted-foreground text-[11px] leading-snug font-body line-clamp-3"
						>
							{item.description}
						</p>
					</div>

					<div class="pt-2 border-t border-border w-full mt-auto space-y-2">
						<p class="text-xs font-body text-card-foreground text-right">
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
