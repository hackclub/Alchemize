<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte"
	import ShopDialog from "$lib/components/shopitem-dialog.svelte"
	//@ts-ignore
	import looseJson from "loose-json"
	import { ShoppingBag } from "lucide-svelte"
	import { toast } from "svelte-sonner"
	import { cn } from "$lib/lib/utils"
	let { data } = $props()
	let currencies = $state(
		looseJson(data.userRecord?.fields?.currency ?? "{}") as UserCurrency
	)

	interface UserCurrency {
		redstone: number
		glowstone: number
		aqua_regia: number
		potion_mix: number
	}

	type ShopItem = {
		itemID: string
		name: string
		description: string
		price: UserCurrency
		image: string
		grayedOut?: boolean
		primaryCurrency: keyof UserCurrency | "none"
	}

	let isDialogOpen = $state(false)
	let selectedItem = $state<ShopItem>({
		name: "",
		description: "",
		price: { redstone: 0, glowstone: 0, aqua_regia: 0, potion_mix: 0 },
		image: "",
		itemID: "",
		primaryCurrency: "none",
	})

	function getPrimaryCurrency(
		price: UserCurrency
	): keyof UserCurrency | "none" {
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
	}

	const shopItems = $derived(
		data?.items?.map((item: any) => ({
			itemID: item.itemID,
			name: item.name,
			description: item.description,
			price: item.itemPrice,
			image: item.cdnImage,
			grayedOut: isGrayedOut(currencies, item.itemPrice),
			primaryCurrency: getPrimaryCurrency(item.itemPrice),
		})) ?? []
	)

	function isGrayedOut(userHas: UserCurrency, itemPrice: UserCurrency) {
		return (
			userHas.redstone < itemPrice.redstone ||
			userHas.glowstone < itemPrice.glowstone ||
			userHas.aqua_regia < itemPrice.aqua_regia ||
			userHas.potion_mix < itemPrice.potion_mix
		)
	}

	function handleBuyClick(item: ShopItem) {
		selectedItem = item
		isDialogOpen = true
	}

	function handleConfirmPurchase(qty: number) {
		currencies.potion_mix -= qty * selectedItem.price.potion_mix
		currencies.redstone -= qty * selectedItem.price.redstone
		currencies.glowstone -= qty * selectedItem.price.glowstone
		currencies.aqua_regia -= qty * selectedItem.price.aqua_regia

		const buyApi = fetch("/dashboard/shop/order", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				itemId: selectedItem.itemID,
				quantity: qty,
			}),
		}).then(res => {
			if (res.ok) {
				toast.success("Purchase successful!")
			} else {
				toast.error("Purchase failed")
			}
		})
	}

	const renderCurrency = (currency: UserCurrency) => {
		if (currency.redstone > 0) return `${currency.redstone} Redstone`
		if (currency.glowstone > 0) return `${currency.glowstone} Glowstone`
		if (currency.aqua_regia > 0) return `${currency.aqua_regia} Aqua Regia`
		if (currency.potion_mix > 0) return `${currency.potion_mix} Potion Mix`
		return "Free"
	}
</script>

<svelte:head>
	<title>Alchemize | Shop</title>
	<meta name="description" content="Alchemize Shop" />
	<meta property="og:title" content="Alchemize | Shop" />
</svelte:head>

<main
	class="h-screen w-full bg-gradbg text-foreground p-4 md:p-6 font-mono tracking-wide selection:bg-primary selection:text-primary-foreground relative overflow-hidden flex flex-col gap-6"
>
	<div class="fixed inset-0 bg-black/40 z-0 pointer-events-none"></div>

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

		<div
			class="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wider pr-15"
		>
			<div
				class="border border-red-500/40 bg-red-800/10 text-red-500 rounded px-3 py-1.5 backdrop-blur-sm"
			>
				<span>Redstone: {currencies.redstone.toString()}</span>
			</div>
			<div
				class="border border-yellow-500/40 bg-yellow-950/20 text-yellow-500 rounded px-3 py-1.5 backdrop-blur-sm"
			>
				<span>Glowstone: {currencies.glowstone.toString()}</span>
			</div>
			<div
				class="border border-blue-500/40 bg-blue-950/20 text-blue-400 rounded px-3 py-1.5 backdrop-blur-sm"
			>
				<span>Aqua Regia: {currencies.aqua_regia.toString()}</span>
			</div>
			<div
				class="border border-rose-500/40 bg-rose-950/20 text-rose-400 rounded px-3 py-1.5 backdrop-blur-sm"
			>
				<span>Potion Mix: {currencies.potion_mix.toString()}</span>
			</div>
		</div>
	</header>

	<div
		class="relative z-10 flex-1 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 align-start content-start"
	>
		{#each shopItems as item}
			{@const theme = currencyTheme[item.primaryCurrency]}
			<div class="relative group h-full flex flex-col">
				<div
					class={cn(
						"absolute z-0 inset-0 translate-x-1 translate-y-1 rounded transition-transform group-hover:translate-x-0 group-hover:translate-y-0 opacity-60",
						theme.shadow
					)}
				></div>

				<div
					class={cn(
						"relative z-10 w-full flex flex-col bg-zinc-950/90 border-2 rounded p-4 h-full gap-4 transition-all backdrop-blur-sm",
						theme.border
					)}
				>
					<div
						class="w-full aspect-square bg-zinc-900/60 border border-zinc-800 rounded overflow-hidden relative shrink-0 flex items-center justify-center p-4"
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

					<div class="flex flex-col flex-1 justify-between gap-3">
						<div class="flex flex-col gap-1.5">
							<div class="flex items-start justify-between gap-2">
								<h2
									class="text-base font-black uppercase text-white tracking-tight font-alchemize line-clamp-1"
								>
									{item.name}
								</h2>
							</div>
							<p
								class="text-zinc-400 text-xs leading-relaxed font-mono line-clamp-3"
							>
								{item.description}
							</p>
						</div>

						<div class="pt-2 border-t border-zinc-900/60 w-full mt-auto">
							<Button
								class={cn(
									"w-full h-9 bg-zinc-900/50 hover:bg-zinc-900 text-xs font-bold font-sans tracking-widest uppercase rounded transition-all duration-100 border active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
									theme.btn,
									item.grayedOut &&
										"pointer-events-none cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-500 shadow-none"
								)}
								onclick={() => handleBuyClick(item)}
							>
								{#if item.grayedOut}
									Locked • {renderCurrency(item.price)}
								{:else}
									Buy • {renderCurrency(item.price)}
								{/if}
							</Button>
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
</main>

<ShopDialog
	allItems={shopItems}
	bind:open={isDialogOpen}
	item={selectedItem}
	currency={currencies}
	onConfirm={handleConfirmPurchase}
/>
