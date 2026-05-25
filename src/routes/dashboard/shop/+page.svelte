<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte"
	import ShopDialog from "$lib/components/shopitem-dialog.svelte"
	import looseJson from "loose-json"
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
		price: number
		image: string
		grayedOut?: boolean
	}

	let isDialogOpen = $state(false)
	let selectedItem = $state<ShopItem>({
		name: "",
		description: "",
		price: 0,
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
			grayedOut: currencies.potion_mix < item.itemPrice,
		})),
	]

	function handleBuyClick(item: ShopItem) {
		selectedItem = item
		isDialogOpen = true
	}

	function handleConfirmPurchase(qty: number) {
		console.log(
			`Purchased ${selectedItem.name} for ${qty * selectedItem.price} potion mixes!`
		)
				currencies.potion_mix -= qty * selectedItem.price

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
				// Update the local currency amount after purchase
			} else {
				alert("Purchase failed")
				console.error("Purchase failed", res)
				const body = res.text().then(text => {
					console.error("Response body:", text)
				})
			}
		})
	}
</script>

<div class="w-full h-screen bg-gradbg overflow-hidden">
	<div class="fixed inset-0 bg-black/60 z-10"></div>

	<div class="relative z-50 h-full flex flex-col">
		<h1 class="text-5xl text-white text-center pt-8 font-alchemize">
			The Shop
		</h1>

		<div class="flex-1 overflow-y-auto px-10 py-10 mt-2">
			<div class="grid grid-cols-4 gap-8 place-items-center">
				{#each shopItems as item}
					<div
						class="w-72 h-104 bg-background rounded-3xl border border-border p-6 flex flex-col justify-between hover:scale-105 transition duration-300"
					>
						<img
							src={item.image}
							alt={item.name}
							class="w-full h-52 object-cover rounded-2xl"
						/>

						<div>
							<h2 class="text-2xl font-bold text-white">{item.name}</h2>
							<p class="text-muted-foreground mt-2">
								{item.description}
							</p>
						</div>

						<Button
							class="w-full py-5 text-black text-lg font-bold hover:bg-primary/80"
							disabled={item.grayedOut}
							onclick={() => handleBuyClick(item)}
						>
							Buy • {item.price}
						</Button>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<ShopDialog
	allItems={shopItems}
	bind:open={isDialogOpen}
	item={selectedItem}
	currency={currencies.potion_mix}
	onConfirm={handleConfirmPurchase}
/>
