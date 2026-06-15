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
	class="h-screen w-full text-foreground p-4 md:p-10 font-mono tracking-wide selection:bg-admin-primary selection:text-admin-foreground relative overflow-hidden flex flex-col"
>
	<div class="fixed inset-0 bg-black/20 z-0 pointer-events-none"></div>

	<div class="relative z-10 w-full h-full flex flex-col gap-6 min-h-0">
		<div
			class="flex flex-col lg:flex-row gap-4 items-center justify-between border-b-2 border-admin-primary/40 pb-4 w-full shrink-0"
		>
			<div class="flex items-center gap-3">
				<ShoppingBag class="h-4 w-4 animate-pulse text-admin-primary" />
				<h1
					class="text-2xl font-alchemize font-black uppercase tracking-wider text-admin-primary [text-shadow:0_2px_10px_rgba(var(--admin-primary),0.2)]"
				>
					The Shop Controls
					<span class="text-[0.5rem] text-white">Alchemize</span>
				</h1>
			</div>
		</div>

		<div
			class="hidden md:grid grid-cols-12 gap-4 px-4 py-1 border-b border-admin-primary/20 text-sm font-bold uppercase text-admin-text tracking-wider shrink-0"
		>
			<div class="col-span-1">Item</div>
			<div class="col-span-5">Details</div>
			<div class="col-span-3 text-right">Cost</div>
			<div class="col-span-3 text-right">Actions</div>
		</div>

		<div
			class="flex flex-col gap-4 overflow-y-auto overflow-x-hidden flex-1 pb-6 pr-2"
		>
			{#each shopItems as item}
				<div class="relative group w-full shrink-0">
					<div
						class="absolute inset-0 bg-admin-primary/80 translate-x-1 translate-y-1 rounded-sm transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5"
					></div>

					<div
						class="relative w-full grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-black/95 border-2 border-admin-primary/90 rounded-sm p-3 transition-transform hover:-translate-x-px hover:-translate-y-px"
					>
						<div class="col-span-1 flex justify-center md:justify-start">
							<div
								class="w-16 h-16 bg-zinc-950 border border-zinc-800 rounded-none overflow-hidden shrink-0 relative"
							>
								<img
									src={item.image}
									alt={item.name}
									class="w-full h-full object-contain scale-100 group-hover:scale-[1.05] transition-transform duration-300"
								/>
								<div
									class="absolute inset-0 bg-linear-to-t from-black/40 to-transparent"
								></div>
							</div>
						</div>

						<div class="col-span-1 md:col-span-5 flex flex-col gap-1 min-w-0">
							<h2
								class="text-sm font-black uppercase text-white tracking-tight font-alchemize"
							>
								{item.name}
							</h2>
							<p
								class="text-zinc-400 text-[11px] leading-snug font-mono tracking-normal line-clamp-2 md:line-clamp-1"
							>
								{item.description}
							</p>
						</div>

						<div
							class="col-span-1 md:col-span-3 flex flex-row md:flex-col justify-between md:justify-center md:items-end text-[11px]"
						>
							<span class="md:hidden text-zinc-500 uppercase font-bold"
								>Cost:</span
							>
							<span class="text-admin-primary font-bold tracking-wider">
								{renderCurrency(item.price)}
							</span>
						</div>

						<div
							class="col-span-1 md:col-span-3 flex justify-end w-full pt-2 md:pt-0"
						>
							<Button
								class="w-full md:w-32 py-3 h-8 border border-admin-primary bg-background text-admin-primary hover:bg-admin-primary hover:text-admin-foreground font-bold tracking-wider uppercase rounded-none transition-all duration-100 shadow-[2px_2px_0px_0px_rgba(var(--admin-primary),0.4)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-[10px]"
								disabled={item.grayedOut}
								onclick={() => handleBuyClick(item)}
							>
								Edit
							</Button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</main>
