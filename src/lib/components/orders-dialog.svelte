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
	}: {
		open: boolean
		orders: Order[]
	} = $props()
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 border-0 bg-transparent p-0 max-w-2xl min-w-[80vw] h-[66vh] text-foreground overflow-visible shadow-none outline-none"
	>
		<div
			class="relative z-10 w-full h-full flex flex-col bg-secondary/30 border-2 border-border rounded rounded-tl-3xl rounded-br-3xl p-4 sm:p-6 gap-4 backdrop-blur-2xl overflow-hidden shadow-lg shadow-primary/10"
		>
			<Dialog.Header class="shrink-0 flex items-center justify-between">
				<Dialog.Title
					class="text-lg sm:text-xl font-display font-black uppercase tracking-wider text-primary"
				>
					Your Orders
				</Dialog.Title>
			</Dialog.Header>

			<div
				class="orders flex-1 w-full flex flex-col gap-3 overflow-y-auto pr-1"
			>
				{#each orders as order}
					{@const isPending = order.fields.status !== "fulfilled"}

					<div class="relative group h-32 shrink-0 w-full flex flex-col">
						<div
							class="absolute inset-0 translate-x-0.5 translate-y-0.5 rounded-xl transition-transform opacity-50 {isPending
								? 'bg-primary/20'
								: 'bg-emerald-600/20'}"
						></div>

						<div
							class="relative z-10 w-full h-full flex bg-secondary border-2 rounded-xl p-3 gap-4 transition-all {isPending
								? 'border-border hover:border-primary/50'
								: 'border-emerald-700/60 hover:border-emerald-700'}"
						>
							<div
								class="h-full aspect-square bg-background border border-border rounded-lg overflow-hidden relative shrink-0 flex items-center justify-center p-2"
							>
								<img
									src={order.fields.cdnImage}
									alt={order.fields.orderItem}
									class="max-w-full max-h-full object-contain relative z-10"
								/>

								<div
									class="absolute inset-0 bg-linear-to-t from-background/70 via-transparent to-transparent z-0"
								></div>
							</div>

							<div class="flex flex-col justify-between flex-1 min-w-0">
								<div class="flex flex-col gap-1">
									<h1
										class="text-sm font-display font-black uppercase text-foreground tracking-tight truncate"
									>
										{order.fields.orderItem}
									</h1>

									<p class="text-xs text-muted-foreground font-body">
										Quantity:
										<span class="text-foreground font-display font-bold">
											{order.fields.qty}
										</span>
									</p>
								</div>

								<div class="mt-auto pt-2">
									<span
										class="inline-flex text-[10px] font-display font-bold tracking-wider uppercase px-2 py-1 rounded-md border {isPending
											? 'border-primary/40 bg-primary/10 text-primary'
											: 'border-emerald-700/50 bg-emerald-700/10 text-emerald-700'}"
									>
										{isPending ? "Pending" : "Fulfilled"}
									</span>
								</div>
							</div>
						</div>
					</div>
				{:else}
					<div class="flex flex-col items-center justify-center flex-1 py-12">
						<p class="font-note text-muted-foreground text-sm">
							No orders yet...
						</p>
					</div>
				{/each}
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
