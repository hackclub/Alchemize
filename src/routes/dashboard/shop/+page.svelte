<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte"
	import ShopDialog from "$lib/components/shopitem-dialog.svelte"
	//@ts-ignore
	import looseJson from "loose-json"
	import { ShoppingBag } from "lucide-svelte"
	import { toast } from "svelte-sonner"
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
	}

	let isDialogOpen = $state(false)
	let selectedItem = $state<ShopItem>({
		name: "",
		description: "",
		price: { redstone: 0, glowstone: 0, aqua_regia: 0, potion_mix: 0 },
		image: "",
		itemID: "",
	})

	const shopItems: ShopItem[] = [
		...data?.items.map((item: any) => ({
			itemID: item.itemID,
			name: item.name,
			description: item.description,
			price: item.itemPrice,
			image: item.cdnImage,
			grayedOut: isGrayedOut(currencies, item.itemPrice),
		})),
	]
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
		console.log(
			`Purchased ${selectedItem.name} for ${qty * selectedItem.price.potion_mix} potion mixes!`
		)
		currencies.potion_mix -= qty * selectedItem.price.potion_mix
		currencies.redstone -= qty * selectedItem.price.redstone
		currencies.glowstone -= qty * selectedItem.price.glowstone
		currencies.aqua_regia -= qty * selectedItem.price.aqua_regia
		currencies = currencies // trigger reactivity
		console.log("Item ID", selectedItem)
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
				console.error("Purchase failed", res)
				const body = res.text().then(text => {
					console.error("Response body:", text)
				})
			}
		})
	}
	const renderCurrency = (currency: UserCurrency) => {
		if (currency.redstone > 0) {
			return `${currency.redstone} Redstone`
		} else if (currency.glowstone > 0) {
			return `${currency.glowstone} Glowstone`
		} else if (currency.aqua_regia > 0) {
			return `${currency.aqua_regia} Aqua Regia`
		} else if (currency.potion_mix > 0) {
			return `${currency.potion_mix} Potion Mix`
		} else {
			return "0 Currency"
		}
	}
</script>

<main
	class="min-h-screen w-full bg-gradbg text-foreground px-2 py-6 md:p-10 font-mono tracking-wide selection:bg-primary selection:text-primary-foreground relative overflow-x-hidden"
>
	<div class="fixed inset-0 bg-black/20 z-0 pointer-events-none"></div>

	<div class="relative z-10 w-full mx-2 flex flex-col gap-8">
		<div
			class="flex flex-col lg:flex-row gap-4 items-center justify-between border-b-2 border-primary/40 pb-4 backdrop-blur-md px-4 py-2 pr-12 -mx-4 rounded-t-sm"
		>
			<div class="flex items-center gap-3">
				<ShoppingBag class="h-4 w-4 animate-pulse text-primary" />
				<h1
					class="text-2xl font-alchemize font-black uppercase tracking-wider text-primary [text-shadow:0_2px_10px_rgba(var(--primary),0.2)]"
				>
					The Shop
					<span class="text-[0.5rem] text-white">Alchemize</span>
				</h1>
			</div>

			<div
				class="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wider"
			>
				<div
					class="border-2 border-primary bg-background text-primary font-bold tracking-wider uppercase rounded-none transition-all duration-100 shadow-[2px_2px_0px_0px_rgba(var(--primary),0.3)] px-2 py-0.5"
				>
					<span>Redstone: {currencies.redstone.toString()}</span>
				</div>
				<div
					class="border-2 border-primary bg-background text-yellow-500 font-bold tracking-wider uppercase rounded-none transition-all duration-100 shadow-[2px_2px_0px_0px_rgba(var(--primary),0.3)] px-2 py-0.5"
				>
					<span>Glowstone: {currencies.glowstone.toString()}</span>
				</div>
				<div
					class="border-2 border-primary bg-background text-blue-500 font-bold tracking-wider uppercase rounded-none transition-all duration-100 shadow-[2px_2px_0px_0px_rgba(var(--primary),0.3)] px-2 py-0.5"
				>
					<span>Aquaregia: {currencies.aqua_regia.toString()}</span>
				</div>
				<div
					class="border-2 border-primary bg-background text-primary font-bold tracking-wider uppercase rounded-none transition-all duration-100 shadow-[2px_2px_0px_0px_rgba(var(--primary),0.3)] px-2 py-0.5"
				>
					<span>Potion mix: {currencies.potion_mix.toString()}</span>
				</div>
			</div>
		</div>

		<div
			class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 gap-6 items-start"
		>
			{#each shopItems as item}
				<div class="relative group">
					<div
						class="absolute inset-0 bg-primary/80 translate-x-1.5 translate-y-1.5 rounded-sm transition-transform group-hover:translate-x-1 group-hover:translate-y-1"
					></div>

					<div
						class="relative w-full flex flex-row bg-black/95 border-2 border-primary/90 rounded-sm p-3 h-[180px] gap-3 transition-transform hover:-translate-x-px hover:-translate-y-px"
					>
						<div
							class="w-[50%] h-full bg-zinc-950 border border-zinc-800 rounded-none overflow-hidden shrink-0 relative"
						>
							<img
								src={item.image}
								alt={item.name}
								class="w-full h-full object-contain scale-100 group-hover:scale-[1.03] transition-transform duration-300"
							/>
							<div
								class="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/40"
							></div>
						</div>

						<div
							class="flex flex-col items-end justify-between flex-1 min-w-0 w-full h-full py-0.5"
						>
							<div class="flex flex-col gap-1 min-w-0 overflow-hidden text-end">
								<h2
									class="text-sm font-black uppercase text-white tracking-tight font-alchemize"
								>
									{item.name}
								</h2>
								<p
									class="text-zinc-400 text-[11px] leading-snug font-mono tracking-normal line-clamp-3"
								>
									{item.description}
								</p>
							</div>

							<div class="pt-2 border-t border-zinc-900 w-full">
								<Button
									class="w-full py-3 h-8 border border-primary bg-background text-primary hover:bg-primary hover:text-primary-foreground font-bold tracking-wider uppercase rounded-none transition-all duration-100 shadow-[2px_2px_0px_0px_rgba(var(--primary),0.4)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-[10px]"
									disabled={item.grayedOut}
									onclick={() => handleBuyClick(item)}
								>
									Buy • {renderCurrency(item.price)}
								</Button>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</main>

<ShopDialog
	allItems={shopItems}
	bind:open={isDialogOpen}
	item={selectedItem}
	currency={currencies}
	onConfirm={handleConfirmPurchase}
/>
