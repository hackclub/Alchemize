<script>
	import Button from "$lib/components/ui/button/button.svelte"
	import Input from "$lib/components/ui/input/input.svelte"
	import { cn } from "$lib/lib/utils"
	const { data } = $props()
	const ordersRaw = data.orders

	//@ts-ignore
	let ordersFulfilled = ordersRaw.filter(order => order.fulfiller !== "")
	//@ts-ignore
	let ordersUnfulfilled = ordersRaw.filter(order => order.fulfiller === "")
	ordersUnfulfilled.sort(
		//@ts-ignore
		(a, b) => new Date(b.createdTime) - new Date(a.createdTime)
	)
	ordersFulfilled.sort(
		//@ts-ignore
		(a, b) => new Date(b.createdTime) - new Date(a.createdTime)
	)
	let orders = [...ordersUnfulfilled, ...ordersFulfilled]

	let searchQuery = $state("")
	let currentTab = $state("all")
	const processedOrders = $derived(() => {
		const raw = [...data.orders]

		raw.sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime())

		const unfulfilled = raw.filter(o => !o.fields.fulfiller)
		const fulfilled = raw.filter(o => o.fields.fulfiller)

		return [...unfulfilled, ...fulfilled]
	})

	const filteredOrders = $derived(() => {
		return processedOrders().filter(order => {
			const orderIdString = "#" + String(order.fields.id)

			const matchesSearch =
				orderIdString.toLowerCase().includes(searchQuery.toLowerCase()) ||
				order.fields.orderItem.toLowerCase().includes(searchQuery.toLowerCase())

			const isFulfilled = !!order.fields.fulfiller
			const matchesTab =
				currentTab === "all" ||
				(currentTab === "pending" && !isFulfilled) ||
				(currentTab === "fulfilled" && isFulfilled)

			return matchesSearch && matchesTab
		})
	})
</script>

<main class="max-h-full w-full p-6 font-sans">
	<div class="mx-auto flex max-h-full max-w-[80%] flex-col gap-y-6">
		<div class="flex flex-col gap-y-2">
			<h1 class="text-2xl font-bold tracking-tight">Fulfillment</h1>
			<p class="text-sm text-zinc-400">Fulfill the orders ordered by the orderers...</p>
		</div>

		<div
			class="flex flex-col items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 backdrop-blur-md sm:flex-row">
			<div class="w-full sm:max-w-xs">
				<Input
					type="text"
					placeholder="Search by ID or item..."
					bind:value={searchQuery}
					class="border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-primary" />
			</div>

			<div class="flex w-full items-center gap-x-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1 sm:w-auto">
				{#each ["all", "pending", "fulfilled"] as tab}
					<button
						type="button"
						class={cn(
							"flex-1 rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-all sm:flex-initial",
							currentTab === tab ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
						)}
						onclick={() => (currentTab = tab)}>
						{tab}
					</button>
				{/each}
			</div>
		</div>

		<ul class="flex max-h-full w-full flex-col gap-y-3 overflow-auto">
			{#each filteredOrders() as order (order.id)}
				<li
					class="group flex w-full items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4 shadow-sm transition-all duration-200 hover:bg-zinc-900/60">
					<div class="flex flex-col gap-y-1">
						<div class="flex items-center gap-x-2">
							<span class="font-mono text-xs text-zinc-500 group-hover:text-zinc-400">#{order.fields.id}</span>
							{#if order.fields.fulfiller}
								<span
									class="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
									Fulfilled
								</span>
							{:else}
								<span
									class="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
									Pending
								</span>
							{/if}
						</div>
						<p class="text-sm font-medium tracking-wide text-zinc-200">
							{order.fields.orderItem}
						</p>
					</div>

					<div>
						<a href={`/admin/fulfillment/orders/${order.fields.id}`}>
							<Button
								variant="outline"
								class={cn(
									"h-9 px-4 text-xs font-medium transition-all duration-200",
									order.fields.fulfiller
										? "border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
										: "border-transparent bg-emerald-600 text-primary-foreground shadow-md shadow-emerald-950/20 hover:bg-emerald-600/50"
								)}>
								{order.fields.fulfiller ? "View Details" : "Process order"}
							</Button>
						</a>
					</div>
				</li>
			{:else}
				<div class="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/10 py-8 text-center">
					<p class="text-sm text-zinc-500">No matches found for your search.</p>
				</div>
			{/each}
		</ul>
	</div>
</main>
