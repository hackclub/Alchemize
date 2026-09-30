<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte"
	import ShopDialog from "$lib/components/shopitem-dialog.svelte"
	import OrdersDialog from "$lib/components/orders-dialog.svelte"
	import { getSlackProfile } from "$lib/utils"
	import { ShoppingBag } from "lucide-svelte"
	import { toast } from "svelte-sonner"
	import { cn } from "$lib/lib/utils"
	import Input from "$lib/components/ui/input/input.svelte"
	import { Search } from "lucide-svelte"
	import { invalidateAll } from "$app/navigation"
	import { formatAqua, hundredthsToUnits } from "$lib/currency"

	let { data } = $props()
	const loggedIn = !!data.userRecord

	let balanceHundredths = $derived(
		data.userRecord?.fields?.balanceHundredths ?? 0
	)

	type ShopItem = {
		itemID: string
		name: string
		description: string
		priceHundredths: number
		image: string
		grayedOut?: boolean
	}

	type SortOption = "none" | "affordable" | "price"

	let affordableOnly = $state(false)
	let activeSort = $state<SortOption>("none")
	let isDialogOpen = $state(false)
	let ordersDialogOpen = $state(false)
	let searchQuery = $state("")

	let selectedItem = $state<ShopItem>({
		name: "",
		description: "",
		priceHundredths: 0,
		image: "",
		itemID: "",
	})

	// 1 Aqua Regia = 1 hour of work
	function getEstimatedHours(priceHundredths: number): number {
		if (priceHundredths <= 0) return 0
		return Math.ceil(hundredthsToUnits(priceHundredths))
	}

	const shopItems = $derived.by(() => {
		const rawItems =
			data?.items?.map((item: any) => {
				const priceHundredths: number = item.priceHundredths ?? 0

				return {
					itemID: item.itemID,
					name: item.name,
					description: item.description,
					priceHundredths,
					image: item.cdnImage,
					grayedOut: balanceHundredths < priceHundredths,
					estimatedHours: getEstimatedHours(priceHundredths),
				}
			}) ?? []

		let filtered = [...rawItems]
		if (affordableOnly) filtered = filtered.filter(item => !item.grayedOut)

		if (activeSort === "none") {
			filtered.sort((a, b) => a.priceHundredths - b.priceHundredths)
		} else if (activeSort === "affordable") {
			filtered.sort((a, b) => Number(a.grayedOut) - Number(b.grayedOut))
		} else {
			filtered.sort((a, b) => b.priceHundredths - a.priceHundredths)
		}

		return filtered
	})

	function handleBuyClick(item: ShopItem) {
		selectedItem = item
		isDialogOpen = true
	}

	function handleConfirmPurchase(qty: number) {
		fetch("/dashboard/shop/order", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ itemId: selectedItem.itemID, quantity: qty }),
		}).then(res => {
			if (res.ok) {
				toast.success("Purchase successful!")
			} else {
				toast.error("Purchase failed")
			}
			invalidateAll()
		})
	}

	let finalItems = $derived(
		shopItems.filter((item: any) =>
			item?.name.toLowerCase().includes(searchQuery.toLowerCase())
		)
	)
</script>

<svelte:head>
	<script src="https://server.fillout.com/embed/v1/"></script>
	<title>Alchemize | Shop</title>
</svelte:head>

<main
	class="h-screen w-full px-10 py-6 tracking-wide relative overflow-hidden flex flex-col font-body"
>
	<header
		class="relative z-10 w-full flex flex-col gap-4 border-b-2 pb-4 shrink-0"
	>
		<div
			class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 py-3 px-8"
		>
			<div class="flex items-center gap-3 text-foreground">
				<ShoppingBag class="size-5" />
				<div>
					<h1
						class="text-xl sm:text-2xl font-display font-black uppercase tracking-wider leading-none"
					>
						The Shop
					</h1>
				</div>
			</div>

			{#if loggedIn}
				<Button
					size="sm"
					variant="outline"
					onclick={() => (ordersDialogOpen = true)}
				>
					Orders
				</Button>
			{/if}
		</div>

		{#if loggedIn}
			<div class="flex w-full font-note font-bold">
				<div
					class="flex items-center justify-between gap-4 rounded-md border-2 px-3 py-2 shadow-sm shadow-blue-900/20 border-blue-700/50 bg-blue-800/10 text-blue-800 dark:border-blue-300/50 dark:bg-blue-300/10 dark:text-blue-300"
				>
					<span class="text-[10px] sm:text-xs uppercase tracking-wider">
						Balance
					</span>
					<span class="font-black text-xs sm:text-sm">
						{formatAqua(balanceHundredths)}
					</span>
				</div>
			</div>
		{/if}
	</header>

	{#if loggedIn}
		<div
			class="relative z-10 w-full flex flex-col lg:flex-row gap-3 lg:gap-4 items-stretch lg:items-center justify-between py-3 border-b-2 border-border shrink-0"
		>
			<div class="flex flex-wrap items-center gap-3">
				<label
					class="flex items-center gap-2 cursor-pointer text-xs font-display font-bold uppercase tracking-wider text-foreground"
				>
					<input
						type="checkbox"
						bind:checked={affordableOnly}
						class="accent-primary"
					/>

					<span>Affordable Only</span>
				</label>

				<div class="hidden sm:block h-5 w-px bg-border"></div>

				<div class="flex items-center gap-2">
					<span
						class="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground"
					>
						Sort:
					</span>

					<select
						bind:value={activeSort}
						class="bg-card text-foreground border-2 border-border rounded-md px-2 py-1.5 outline-none focus:border-primary font-body text-xs cursor-pointer"
					>
						<option value="none">Default</option>
						<option value="affordable">Affordable First</option>
						<option value="price">Highest Cost</option>
					</select>
				</div>
			</div>

			<div class="flex items-center gap-2 w-full lg:w-auto">
				<div class="relative w-full lg:w-64">
					<Input
						class="w-full border-2 border-border bg-card rounded-md font-body text-foreground pr-9 focus:border-primary"
						bind:value={searchQuery}
						placeholder="Search items..."
					/>

					<Search
						class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4 pointer-events-none"
					/>
				</div>
			</div>
		</div>
	{/if}

	<div
		class="relative z-10 flex-1 min-h-0 overflow-y-auto pr-2 pt-4 pb-6 grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4 content-start"
	>
		{#each finalItems as item}
			<div
				class={cn(
					"relative z-10 w-full flex flex-col bg-card border-2 rounded rounded-tl-3xl rounded-br-3xl p-3 h-full gap-3 backdrop-blur-sm transition-all",
					"shadow-aqr border-blue-900"
				)}
			>
				<div
					class="w-full aspect-square border bg-background rounded rounded-tl-3xl rounded-br-3xl overflow-hidden relative shrink-0 flex items-center justify-center p-3"
				>
					<img
						src={item.image}
						alt={item.name}
						class="max-w-full max-h-full object-contain rounded rounded-tl-3xl rounded-br-3xl transform scale-100 group-hover:scale-[1.05] transition-transform duration-300 relative z-10"
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
						<div class="flex items-center justify-between gap-2">
							<p class="text-muted-foreground text-[11px] font-body font-bold">
								~{item.estimatedHours} hrs
							</p>

							<p class={cn("text-xs font-body text-card-foreground")}>
								{formatAqua(item.priceHundredths)}
							</p>
						</div>

						<Button
							variant="secondary"
							class={cn(
								"w-full",
								item.grayedOut &&
									"pointer-events-none cursor-not-allowed border bg-muted text-muted-foreground shadow-none"
							)}
							onclick={() => handleBuyClick(item)}
						>
							{#if !loggedIn}
								<a href="/" class="hover:text-primary"> Login to Purchase </a>
							{:else if item.grayedOut}
								Locked...
							{:else}
								Buy ~ {formatAqua(item.priceHundredths)}
							{/if}
						</Button>
					</div>
				</div>
			</div>
		{/each}
	</div>
</main>

{#if loggedIn}
	<ShopDialog
		allItems={shopItems}
		bind:open={isDialogOpen}
		item={selectedItem}
		{balanceHundredths}
		onConfirm={handleConfirmPurchase}
	/>

	<OrdersDialog bind:open={ordersDialogOpen} orders={data.orders ?? []} />
{/if}

<style>
	.shadow-aqr {
		box-shadow: 4px 4px 0px var(--color-blue-600);
	}
</style>
