<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog/index.js"

	type Order = {
		fields: {
			cdnImage: string
			orderItem: string
			qty: number
			status: string
		}
	}

	let {
		open = $bindable(false),
		orders = [],
		unavailable = false,
	}: {
		open: boolean
		orders: Order[]
		// The orders couldn't be loaded, so an empty list doesn't mean "no orders"
		unavailable?: boolean
	} = $props()
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="fixed top-1/2 left-1/2 z-50 h-[66vh] max-w-2xl min-w-[80vw] -translate-x-1/2 -translate-y-1/2 overflow-visible border-0 bg-transparent p-0 text-foreground shadow-none outline-none">
		<div
			class="relative z-10 flex h-full w-full flex-col gap-4 overflow-hidden rounded rounded-tl-3xl rounded-br-3xl border-2 border-border bg-secondary/30 p-4 shadow-lg shadow-primary/10 backdrop-blur-2xl sm:p-6">
			<Dialog.Header class="flex shrink-0 items-center justify-between">
				<Dialog.Title class="font-display text-lg font-black tracking-wider text-primary uppercase sm:text-xl">
					Your Orders
				</Dialog.Title>
			</Dialog.Header>

			<div class="orders flex w-full flex-1 flex-col gap-3 overflow-y-auto pr-1">
				{#each orders as order}
					{@const isPending = order.fields.status !== "fulfilled"}

					<div class="group relative flex h-32 w-full shrink-0 flex-col">
						<div
							class="absolute inset-0 translate-x-0.5 translate-y-0.5 rounded-xl opacity-50 transition-transform {isPending
								? 'bg-primary/20'
								: 'bg-emerald-600/20'}">
						</div>

						<div
							class="relative z-10 flex h-full w-full gap-4 rounded-xl border-2 bg-secondary p-3 transition-all {isPending
								? 'border-border hover:border-primary/50'
								: 'border-emerald-700/60 hover:border-emerald-700'}">
							<div
								class="relative flex aspect-square h-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background p-2">
								<img
									src={order.fields.cdnImage}
									alt={order.fields.orderItem}
									class="relative z-10 max-h-full max-w-full object-contain" />

								<div class="absolute inset-0 z-0 bg-linear-to-t from-background/70 via-transparent to-transparent">
								</div>
							</div>

							<div class="flex min-w-0 flex-1 flex-col justify-between">
								<div class="flex flex-col gap-1">
									<h1 class="truncate font-display text-sm font-black tracking-tight text-foreground uppercase">
										{order.fields.orderItem}
									</h1>

									<p class="font-body text-xs text-muted-foreground">
										Quantity:
										<span class="font-display font-bold text-foreground">
											{order.fields.qty}
										</span>
									</p>
								</div>

								<div class="mt-auto pt-2">
									<span
										class="inline-flex rounded-md border px-2 py-1 font-display text-[10px] font-bold tracking-wider uppercase {isPending
											? 'border-primary/40 bg-primary/10 text-primary'
											: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'}">
										{isPending ? "Pending" : "Fulfilled"}
									</span>
								</div>
							</div>
						</div>
					</div>
				{:else}
					<div class="flex flex-1 flex-col items-center justify-center py-12">
						<p class="font-note text-sm text-muted-foreground">
							{unavailable ? "Your orders couldn't be loaded right now, please try again later." : "No orders yet..."}
						</p>
					</div>
				{/each}
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
