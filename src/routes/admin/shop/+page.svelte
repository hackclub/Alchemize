<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte"
	import { Input } from "$lib/components/ui/input/index.js"
	import ShopDialog from "$lib/components/shop-management-dialog.svelte"
	//@ts-ignore
	import { loaderStore } from "$lib/stores/adminLoader"
	import { ShoppingBag, Search } from "lucide-svelte"
	import { toast } from "svelte-sonner"
	import { Plus } from "@lucide/svelte"
	import { invalidateAll } from "$app/navigation"
	import { formatAqua } from "$lib/currency"
	let { data } = $props()
	interface Item {
		itemID: string
		name: string
		description: string
		priceHundredths: number
		image: string
	}
	let isDialogOpen = $state(false)
	let selectedItem = $state<Item>({
		name: "",
		description: "",
		priceHundredths: 0,
		image: "",
		itemID: "",
	})

	let searchQuery = $state("")

	let shopItems = $derived(
		data?.items?.map((item): Item => ({
			itemID: item.itemID,
			name: item.name,
			description: item.description,
			priceHundredths: item.priceHundredths,
			image: item.cdnImage,
		})) ?? []
	)

	let filteredItems = $derived(
		shopItems.filter(
			item =>
				item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.description.toLowerCase().includes(searchQuery.toLowerCase())
		)
	)

	let openCreateItem = $state(false)
	let openEditItem = $state(false)
	const invalidater = async () => {
		loaderStore.set(true)
		await invalidateAll()
		loaderStore.set(false)
	}
</script>

<svelte:head>
	<title>Alchemize | Manage Shop</title>
	<meta name="description" content="Alchemize Manage Shop" />
	<meta property="og:title" content="Alchemize | Manage Shop" />
</svelte:head>

<main
	class="selection:text-admin-foreground relative flex h-screen w-full flex-col overflow-hidden p-4 font-mono tracking-wide text-foreground selection:bg-primary md:p-10">
	<div class="pointer-events-none fixed inset-0 z-0 bg-black/20"></div>

	<div class="relative z-10 flex h-full min-h-0 w-full flex-col gap-6">
		<div
			class="flex w-full shrink-0 flex-col items-center justify-between gap-4 border-b-2 border-primary/40 pr-10 pb-4 lg:flex-row">
			<div class="flex items-center gap-3">
				<ShoppingBag class="h-4 w-4 animate-pulse text-primary" />
				<h1
					class="font-alchemize text-2xl font-black tracking-wider text-primary uppercase [text-shadow:0_2px_10px_rgba(var(--primary),0.2)]">
					Manage Shop
				</h1>
			</div>
			<Button
				class="rounded-sm bg-primary font-bold text-primary hover:bg-primary/70"
				onclick={() => (openCreateItem = true)}>
				<Plus />
				Add Item
			</Button>
		</div>

		<div class="relative w-full shrink-0">
			<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-primary/60" />
			<Input
				type="text"
				placeholder="SEARCH SHOP BY NAME OR DESCRIPTION..."
				bind:value={searchQuery}
				class="h-10 rounded-none border-2 border-primary/40 bg-black/80 pl-10 font-mono text-xs tracking-widest text-primary-foreground uppercase placeholder:text-zinc-600 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary" />
		</div>

		<div
			class="hidden shrink-0 grid-cols-12 gap-4 border-b border-primary/20 px-4 py-1 text-sm font-bold tracking-wider text-primary uppercase md:grid">
			<div class="col-span-1">Item</div>
			<div class="col-span-5">Details</div>
			<div class="col-span-3 text-right">Cost</div>
			<div class="col-span-3 text-right">Actions</div>
		</div>

		<div class="flex flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto pr-2 pb-6">
			{#each filteredItems as item (item.itemID)}
				<div class="group relative w-full shrink-0">
					<div
						class="absolute inset-0 translate-x-1 translate-y-1 rounded-sm bg-primary/80 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5">
					</div>

					<div
						class="relative grid w-full grid-cols-1 items-center gap-4 rounded-sm border-2 border-primary/90 bg-black/95 p-3 transition-transform hover:-translate-x-px hover:-translate-y-px md:grid-cols-12">
						<div class="col-span-1 flex justify-center md:justify-start">
							<div class="relative h-16 w-16 shrink-0 overflow-hidden rounded-none border border-zinc-800 bg-zinc-950">
								<img
									src={item.image}
									alt={item.name}
									class="h-full w-full scale-100 object-contain transition-transform duration-300 group-hover:scale-[1.05]" />
								<div class="absolute inset-0 bg-linear-to-t from-black/40 to-transparent"></div>
							</div>
						</div>

						<div class="col-span-1 flex min-w-0 flex-col gap-1 md:col-span-5">
							<h2 class="font-alchemize text-sm font-black tracking-tight text-primary-foreground uppercase">
								{item.name}
							</h2>
							<p class="line-clamp-2 font-mono text-[11px] leading-snug tracking-normal text-zinc-400 md:line-clamp-1">
								{item.description}
							</p>
						</div>

						<div
							class="col-span-1 flex flex-row justify-between text-[11px] md:col-span-3 md:flex-col md:items-end md:justify-center">
							<span class="font-bold text-zinc-500 uppercase md:hidden">Cost:</span>
							<span class="font-bold tracking-wider text-primary">
								{formatAqua(item.priceHundredths)}
							</span>
						</div>

						<div class="col-span-1 flex w-full justify-end pt-2 md:col-span-3 md:pt-0">
							<Button
								class="h-8 w-full rounded-none border border-primary bg-background py-3 text-[10px] font-bold tracking-wider  text-primary uppercase shadow-[2px_2px_0px_0px_rgba(var(--primary),0.4)] transition-all duration-100 hover:bg-primary hover:text-black active:translate-x-0.5 active:translate-y-0.5 active:shadow-none md:w-32"
								onclick={() => {
									selectedItem = item
									openEditItem = true
								}}>
								Edit
							</Button>
						</div>
					</div>
				</div>
			{:else}
				<div
					class="border-2 border-dashed border-zinc-800 py-12 text-center text-xs tracking-widest text-zinc-500 uppercase">
					No items matching your current search.
				</div>
			{/each}
		</div>
	</div>
</main>
<ShopDialog bind:open={openCreateItem} mode="create" shopItem={null} {invalidater} />
<ShopDialog bind:open={openEditItem} mode="update" shopItem={selectedItem} {invalidater} />
