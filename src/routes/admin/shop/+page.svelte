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
	let { data } = $props()
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
	}
	interface Item {
		itemID: string
		name: string
		description: string
		price: {
			redstone: number
			glowstone: number
			aqua_regia: number
			potion_mix: number
		}
		image: string
	}
	let isDialogOpen = $state(false)
	let selectedItem = $state<Item>({
		name: "",
		description: "",
		price: { redstone: 0, glowstone: 0, aqua_regia: 0, potion_mix: 0 },
		image: "",
		itemID: "",
	})

	let searchQuery = $state("")

	let shopItems = $derived(
		data?.items?.map((item: any) => ({
			itemID: item.itemID,
			name: item.name,
			description: item.description,
			price: item.itemPrice,
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
	class="h-screen w-full text-foreground p-4 md:p-10 font-mono tracking-wide selection:bg-admin-primary selection:text-admin-foreground relative overflow-hidden flex flex-col"
>
	<div class="fixed inset-0 bg-black/20 z-0 pointer-events-none"></div>

	<div class="relative z-10 w-full h-full flex flex-col gap-6 min-h-0">
		<div
			class="flex flex-col lg:flex-row gap-4 items-center justify-between border-b-2 border-admin-primary/40 pb-4 w-full shrink-0 pr-10"
		>
			<div class="flex items-center gap-3">
				<ShoppingBag class="h-4 w-4 animate-pulse text-admin-primary" />
				<h1
					class="text-2xl font-alchemize font-black uppercase tracking-wider text-admin-primary [text-shadow:0_2px_10px_rgba(var(--admin-primary),0.2)]"
				>
					Manage Shop
				</h1>
			</div>
			<Button
				class="bg-admin-primary text-admin-text rounded-sm font-bold hover:bg-admin-primary/70"
				onclick={() => (openCreateItem = true)}
			>
				<Plus />
				Add Item
			</Button>
		</div>

		<div class="relative w-full shrink-0">
			<Search
				class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-admin-primary/60"
			/>
			<Input
				type="text"
				placeholder="SEARCH SHOP BY NAME OR DESCRIPTION..."
				bind:value={searchQuery}
				class="pl-10 uppercase text-xs tracking-widest h-10 border-2 border-admin-primary/40 bg-black/80 rounded-none text-white focus-visible:ring-1 focus-visible:ring-admin-primary focus-visible:border-admin-primary placeholder:text-zinc-600 font-mono"
			/>
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
			{#each filteredItems as item (item.itemID)}
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
								class="w-full md:w-32 py-3 h-8 border border-admin-primary bg-background text-admin-primary hover:text-black hover:bg-admin-primary  font-bold tracking-wider uppercase rounded-none transition-all duration-100 shadow-[2px_2px_0px_0px_rgba(var(--admin-primary),0.4)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-[10px]"
								onclick={() => {
									selectedItem = item
									openEditItem = true
								}}
							>
								Edit
							</Button>
						</div>
					</div>
				</div>
			{:else}
				<div
					class="text-center py-12 border-2 border-dashed border-zinc-800 text-zinc-500 uppercase text-xs tracking-widest"
				>
					No items matching your current search.
				</div>
			{/each}
		</div>
	</div>
</main>
<ShopDialog
	bind:open={openCreateItem}
	mode="create"
	shopItem={null}
	{invalidater}
/>
<ShopDialog
	bind:open={openEditItem}
	mode="update"
	shopItem={selectedItem}
	{invalidater}
/>
