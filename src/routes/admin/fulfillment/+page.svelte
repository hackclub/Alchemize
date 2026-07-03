<script>
	import Button from "$lib/components/ui/button/button.svelte"
	import Input from "$lib/components/ui/input/input.svelte"
	const { data } = $props()
	const orders = data.orders
	console.log(orders)
</script>

<main class="w-full h-full">
	<div class="fixed inset-0 bg-black/20 -z-10"></div>
	<div
		class="relative z-50 p-5 h-full w-full flex flex-col items-start justify-start gap-x-5"
	>
		<div class="flex w-full mb-6 sticky">
			<Input placeholder="Search using order ID..." />
		</div>

		<div
			class="users-list w-full flex flex-col items-center justify-start gap-y-2 list-none p-2"
		>
			{#each orders as order}
				<li
					class="w-full py-1 bg-background/40 rounded-xl border-2 p-2 flex items-center justify-between"
				>
				
					<p class="font-alchemize">
					
						 {order.fields.id} | {order.fields.qty} x {order.fields.orderItem} | {order.fields.ordererEmail}
					</p>
				<a href={`/admin/fulfillment/orders/${order.fields.id}`}>
					<Button class="bg-admin-primary border border-muted hover:scale-104">
						View Order
					</Button>
				</a>
			</li>
			{/each}
		</div>
	</div>
</main>
