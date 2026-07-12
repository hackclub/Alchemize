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
	console.log(orders)

	let searchQuery = $state("")
	let currentTab = $state("all")
	const processedOrders = $derived(() => {
		const raw = [...data.orders]

		raw.sort(
			(a, b) =>
				new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
		)

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

<main class="w-full max-h-full p-6 font-sans">
	<div class="max-w-[80%] mx-auto max-h-full flex flex-col gap-y-6">
		<div class="flex flex-col gap-y-2">
			<h1 class="text-2xl font-bold tracking-tight">Fulfillment</h1>
			<p class="text-sm text-zinc-400">
				Fulfill the orders ordered by the orderers...
			</p>
		</div>

		<div
			class="flex flex-col sm:flex-row gap-3 items-center justify-between bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 backdrop-blur-md"
		>
			<div class="w-full sm:max-w-xs">
				<Input
					type="text"
					placeholder="Search by ID or item..."
					bind:value={searchQuery}
					class="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-admin-primary"
				/>
			</div>

			<div
				class="flex items-center gap-x-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 w-full sm:w-auto"
			>
				{#each ["all", "pending", "fulfilled"] as tab}
					<button
						type="button"
						class={cn(
							"flex-1 sm:flex-initial px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all",
							currentTab === tab
								? "bg-zinc-800 text-zinc-100 shadow-sm"
								: "text-zinc-400 hover:text-zinc-200"
						)}
						onclick={() => (currentTab = tab)}
					>
						{tab}
					</button>
				{/each}
			</div>
		</div>

		<ul class="flex flex-col gap-y-3 w-full max-h-full overflow-auto">
			{#each filteredOrders() as order (order.id)}
				<li
					class="w-full bg-zinc-900/30 hover:bg-zinc-900/60 rounded-xl border border-zinc-800/80 p-4 flex items-center justify-between transition-all duration-200 shadow-sm group"
				>
					<div class="flex flex-col gap-y-1">
						<div class="flex items-center gap-x-2">
							<span
								class="text-xs font-mono text-zinc-500 group-hover:text-zinc-400"
								>#{order.fields.id}</span
							>
							{#if order.fields.fulfiller}
								<span
									class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
								>
									Fulfilled
								</span>
							{:else}
								<span
									class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"
								>
									Pending
								</span>
							{/if}
						</div>
						<p class="text-sm font-medium text-zinc-200 tracking-wide">
							{order.fields.orderItem}
						</p>
					</div>

					<div>
						<a href={`/admin/fulfillment/orders/${order.fields.id}`}>
							<Button
								variant="outline"
								class={cn(
									"text-xs transition-all duration-200 px-4 h-9 font-medium",
									order.fields.fulfiller
										? "border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
										: "bg-emerald-600 text-white hover:bg-emerald-600/50 border-transparent shadow-md shadow-emerald-950/20"
								)}
							>
								{order.fields.fulfiller ? "View Details" : "Process order"}
							</Button>
						</a>
					</div>
				</li>
			{:else}
				<div
					class="text-center py-8 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10"
				>
					<p class="text-sm text-zinc-500">No matches found for your search.</p>
				</div>
			{/each}
		</ul>
	</div>
</main>
