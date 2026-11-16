<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte"
	import ShopDialog from "$lib/components/shopitem-dialog.svelte"
	import OrdersDialog from "$lib/components/orders-dialog.svelte"
	import { ShoppingBag } from "lucide-svelte"
	import { toast } from "svelte-sonner"
	import { cn } from "$lib/lib/utils"
	import Input from "$lib/components/ui/input/input.svelte"
	import { Search } from "lucide-svelte"
	import { invalidateAll } from "$app/navigation"
	import { formatAqua, hundredthsToUnits } from "$lib/currency"

	let { data } = $props()
	const loggedIn = !!data.userRecord

	let balanceHundredths = $derived(data.userRecord?.fields?.balanceHundredths ?? 0)

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
			data?.items?.map(item => {
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

	let finalItems = $derived(shopItems.filter(item => item?.name.toLowerCase().includes(searchQuery.toLowerCase())))
</script>

<svelte:head>
	<script src="https://server.fillout.com/embed/v1/"></script>
	<title>Alchemize | Shop</title>
</svelte:head>

<main class="relative flex h-screen w-full flex-col overflow-hidden px-10 py-6 font-body tracking-wide">
	<header class="relative z-10 w-full shrink-0">
		<div class="flex flex-col items-start justify-between gap-4 border-b-2 px-8 py-3 sm:flex-row sm:items-center">
			<div class="flex items-center gap-3 text-foreground">
				<ShoppingBag class="size-5" />
				<div>
					<h1 class="font-display text-xl leading-none font-black tracking-wider uppercase sm:text-2xl">The Shop</h1>
				</div>
			</div>

			{#if loggedIn}
				<div class="flex w-full items-center gap-2 font-note font-bold sm:w-auto">
					<div
						class="flex items-center gap-2 rounded-md border border-blue-300/50 bg-blue-300/10 px-2 py-1.5 text-blue-300">
						<img src="/alch-aquaregia.png" alt="" class="size-7 object-contain" />
						<span class="font-display text-sm font-black">
							{formatAqua(balanceHundredths)}
						</span>
					</div>

					<Button size="sm" variant="outline" onclick={() => (ordersDialogOpen = true)}>Orders</Button>
				</div>
			{/if}
		</div>
	</header>

	{#if loggedIn}
		<div
			class="relative z-10 flex w-full shrink-0 flex-col items-stretch justify-between gap-3 border-b-2 border-border py-3 lg:flex-row lg:items-center lg:gap-4">
			<div class="flex flex-wrap items-center gap-3">
				<label
					class="flex cursor-pointer items-center gap-2 font-display text-xs font-bold tracking-wider text-foreground uppercase">
					<input type="checkbox" bind:checked={affordableOnly} class="accent-primary" />

					<span>Affordable Only</span>
				</label>

				<div class="hidden h-5 w-px bg-border sm:block"></div>

				<div class="flex items-center gap-2">
					<span class="font-display text-xs font-bold tracking-wider text-muted-foreground uppercase"> Sort: </span>

					<select
						bind:value={activeSort}
						class="cursor-pointer rounded-md border-2 border-border bg-card px-2 py-1.5 font-body text-xs text-foreground outline-none focus:border-primary">
						<option value="none">Default</option>
						<option value="affordable">Affordable First</option>
						<option value="price">Highest Cost</option>
					</select>
				</div>
			</div>

			<div class="flex w-full items-center gap-2 lg:w-auto">
				<div class="relative w-full lg:w-64">
					<Input
						class="w-full rounded-md border-2 border-border bg-card pr-9 font-body text-foreground focus:border-primary"
						bind:value={searchQuery}
						placeholder="Search items..." />

					<Search class="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
				</div>
			</div>
		</div>
	{/if}

	<div
		class="relative z-10 grid min-h-0 flex-1 grid-cols-[repeat(auto-fill,minmax(250px,1fr))] content-start gap-4 overflow-y-auto pt-4 pr-2 pb-6">
		{#each finalItems as item (item.itemID)}
			<div
				class="shadow-aqr relative z-10 flex h-full w-full flex-col gap-3 rounded rounded-tl-3xl rounded-br-3xl border-2 border-border bg-card p-3 backdrop-blur-sm transition-all">
				<div
					class="relative flex aspect-square w-full shrink-0 items-center justify-center overflow-hidden rounded rounded-tl-3xl rounded-br-3xl border bg-background p-3">
					<img
						src={item.image}
						alt={item.name}
						class="object-scale relative z-10 max-h-full max-w-full rounded rounded-tl-3xl rounded-br-3xl" />
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
						<div class="flex items-center justify-between gap-2">
							<p class="font-body text-[11px] font-bold text-muted-foreground">
								~{item.estimatedHours} hrs
							</p>

							<p class={cn("font-body text-xs text-card-foreground")}>
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
							onclick={() => handleBuyClick(item)}>
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
	<ShopDialog bind:open={isDialogOpen} item={selectedItem} {balanceHundredths} onConfirm={handleConfirmPurchase} />

	<OrdersDialog bind:open={ordersDialogOpen} orders={data.orders ?? []} unavailable={data.ordersUnavailable} />
{/if}

<style>
	.shadow-aqr {
		box-shadow: 4px 4px 0px var(--color-primary);
	}
</style>
