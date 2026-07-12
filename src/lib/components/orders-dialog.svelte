<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog/index.js"

	type Order = {
		fields: {
			cdnImage: string
			orderItem: string
			qty: number
			fulfiller: string
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
		class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 border-0 bg-transparent p-0 max-w-2xl min-w-[80vw] h-[66vh] font-mono text-white overflow-visible shadow-none outline-none"
	>
		<div
			class="absolute z-0 inset-0 translate-x-1.5 translate-y-1.5 rounded bg-primary/20 pointer-events-none border-2 border-primary/40"
		></div>

		<div
			class="relative z-10 w-full h-full flex flex-col bg-zinc-950/90 border-2 border-zinc-800 rounded p-4 gap-3 backdrop-blur-sm overflow-hidden"
		>
			<Dialog.Header
				class="pt-2 border-b border-zinc-800 pb-3 shrink-0 flex items-start justify-between"
			>
				<Dialog.Title
					class="text-md font-black uppercase text-primary tracking-wider font-alchemize [text-shadow:0_2px_10px_rgba(var(--primary),0.2)]"
				>
					Your Orders
				</Dialog.Title>
			</Dialog.Header>

			<div
				class="orders flex-1 w-full flex flex-col gap-4 overflow-y-auto pr-1"
			>
				{#each orders as order}
					{@const isPending = order.fields.fulfiller === ""}
					<div class="relative group h-32 shrink-0 w-full flex flex-col">
						<div
							class="absolute z-0 inset-0 translate-x-0.5 translate-y-0.5 rounded transition-transform opacity-60 bg-zinc-900 layer-shadow {isPending
								? 'bg-primary/20'
								: 'bg-emerald-500/20'}"
						></div>

						<div
							class="relative z-10 w-full h-full flex bg-zinc-950/40 border-2 rounded p-3 gap-4 backdrop-blur-sm transition-all {isPending
								? 'border-primary/50'
								: 'border-emerald-800/80'}"
						>
							<div
								class="h-full aspect-square bg-zinc-900/60 border border-zinc-800 rounded overflow-hidden relative shrink-0 flex items-center justify-center p-2"
							>
								<img
									src={order.fields.cdnImage}
									alt={order.fields.orderItem}
									class="max-w-full max-h-full object-contain relative z-10"
								/>
								<div
									class="absolute inset-0 bg-linear-to-t from-zinc-950/80 via-transparent to-transparent z-0"
								></div>
							</div>

							<div class="flex flex-col justify-between flex-1 min-w-0">
								<div class="flex flex-col gap-0.5">
									<h1
										class="text-sm font-black uppercase text-white tracking-tight font-alchemize truncate"
									>
										{order.fields.orderItem}
									</h1>
									<p class="text-[11px] text-zinc-400 font-mono">
										Quantity: <span class="text-white font-bold"
											>{order.fields.qty}</span
										>
									</p>
								</div>

								<div class="pt-1.5 border-t border-zinc-800/60 w-full mt-auto">
									<span
										class="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border {isPending
											? 'border-primary/40 bg-primary/10 text-primary'
											: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'}"
									>
										{isPending ? "Pending" : "Fulfilled"}
									</span>
								</div>
							</div>
						</div>
					</div>
				{:else}
					<div class="flex flex-col items-center justify-center flex-1 py-12">
						<p class="font-mono text-zinc-500 text-sm">No orders yet...</p>
					</div>
				{/each}
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
