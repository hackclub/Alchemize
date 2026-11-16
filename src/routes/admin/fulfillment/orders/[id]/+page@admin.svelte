<script>
	import Button from "$lib/components/ui/button/button.svelte"
	import { MapPin, PackageCheck, Calendar, User, Repeat, Undo2 } from "lucide-svelte"
	import { toast } from "svelte-sonner"
	const { data } = $props()
	const order = data.orderDetails
	const markAsFulfilled = async () => {
		console.log("Marking as fulfilled...")
		fetch(`/admin/fulfillment/fulfilled`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ orderId: order.id }),
		})
			.then(response => {
				if (response.ok) {
					toast.success("Order marked as fulfilled!")
				} else {
					toast.error("Failed to mark order as fulfilled.")
				}
			})
			.catch(error => {
				console.error("Error marking order as fulfilled:", error)
				toast.error("An error occurred while marking the order as fulfilled.")
			})
		window.location.href = "/admin/fulfillment"
	}
</script>

<a href="/admin/fulfillment" class="absolute top-2 left-2 z-50 rounded-md p-1 hover:bg-zinc-900">
	<Undo2 />
</a>

<main
	class="custom-scrollbar relative flex h-full max-h-screen w-full flex-col items-center justify-center overflow-x-hidden overflow-y-scroll p-4 text-primary md:p-8">
	{#if order.fulfiller !== ""}
		<div class="mb-20 flex h-10 w-2/5 items-center justify-center rounded-xl border-2 border-green-600 bg-green-800/50">
			!!!! Fullfilled order, Fulfilled by {order.fulfiller}
		</div>
	{/if}
	<div
		class="custom-scrollbar relative z-50 grid h-[85vh] w-full max-w-5xl grid-cols-1 divide-y divide-slate-800/60 overflow-x-hidden rounded-2xl border border-slate-700/40 bg-slate-900/70 shadow-2xl backdrop-blur-md md:grid-cols-2 md:divide-x md:divide-y-0">
		<div class="flex h-full flex-col justify-between p-6 md:p-8">
			<div class="space-y-6">
				<div class="flex justify-center rounded-xl border border-slate-800/50 bg-slate-950/40 p-6 shadow-inner">
					<img src={order.img} alt="Product Preview" class="h-48 w-48 object-contain" />
				</div>

				<h1 class="text-center font-alchemize text-3xl font-extrabold tracking-wide md:text-left">
					{order.name}
				</h1>

				<div class="space-y-3 rounded-xl border border-slate-800/40 bg-slate-950/30 p-4 text-sm">
					<div class="flex items-center gap-3">
						<Repeat class="h-4 w-4 text-slate-400" />
						<span class="w-24 text-primary/60">Quantity:</span>
						<span class="font-semibold text-zinc-200">{order.qty}</span>
					</div>
					<div class="flex items-center gap-3">
						<Calendar class="h-4 w-4 text-slate-400" />
						<span class="w-24 text-primary/60">Ordered on:</span>
						<span class="font-semibold text-zinc-200">{new Date(order.dateCreated).toLocaleDateString()}</span>
					</div>
					<div class="flex items-center gap-3">
						<User class="h-4 w-4 text-slate-400" />
						<span class="w-24 text-primary/60">Ordered by:</span>
						<span class="font-semibold text-zinc-200">{order.email}</span>
					</div>
				</div>
			</div>

			<div class="mt-6 grid grid-cols-1 gap-3 border-t border-slate-800/40 pt-6 sm:grid-cols-2">
				{#if order.fulfiller === ""}
					<Button
						class="w-full bg-emerald-600 font-medium text-primary-foreground shadow-lg transition-all hover:bg-emerald-500"
						onclick={markAsFulfilled}>
						Mark as Fulfilled
					</Button>
				{/if}
				<!-- <Button
					variant="outline"
					class="border-slate-700 hover:bg-slate-800 text-primary font-medium transition-all w-full"
				>
					Mark as Unfulfilled
				</Button> -->
			</div>
		</div>

		<div class="flex h-full flex-col gap-y-6 bg-slate-950/20 p-6 md:p-8">
			<div class="space-y-4 rounded-xl border border-slate-800/60 bg-slate-950/40 p-5 shadow-sm">
				<div class="flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
					<MapPin class="h-4 w-4 text-amber-500" />
					<h2 class="font-alchemize text-base font-bold">Shipping Address</h2>
				</div>

				<div class="space-y-3 text-sm">
					<div class="space-y-0.5">
						<span class="block text-[11px] font-semibold tracking-wider text-primary/40 uppercase">Recipient</span>
						<p class="font-semibold text-zinc-200">
							{order.firstName}
						</p>
						<p class="font-mono text-xs text-primary/50">
							{order.ageNow} years old
						</p>
					</div>

					<div class="space-y-0.5 pt-1">
						<span class="block text-[11px] font-semibold tracking-wider text-primary/40 uppercase">Destination</span>
						<p class="leading-relaxed font-medium text-zinc-200">
							{order.email}
						</p>
						<p class="text-xs text-zinc-400">
							HCB — <span class="font-mono text-zinc-300">Card Grant</span>
						</p>
					</div>
				</div>
			</div>

			<div
				class="flex flex-1 flex-col justify-between space-y-4 rounded-xl border border-slate-800/60 bg-slate-950/40 p-5 shadow-sm">
				<div>
					<div class="mb-4 flex items-center justify-between border-b border-slate-800/80 pb-2.5">
						<div class="flex items-center gap-2">
							<PackageCheck class="h-4 w-4 text-indigo-400" />
							<h2 class="font-alchemize text-base font-bold">User Analytics</h2>
						</div>
						<span
							class="rounded-md border border-slate-700/40 bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-primary/70">
							@Slack ID HERE
						</span>
					</div>
					Remind me to add this someday
					<!-- <div class="grid grid-cols-2 gap-3">
						<div
							class="flex flex-col p-3 bg-slate-900/50 rounded-lg border border-slate-800/50"
						>
							<span
								class="text-[10px] text-primary/50 font-semibold uppercase tracking-wider mb-0.5"
								>Total Hours</span
							>
							<span class="text-lg font-black text-blue-400 tracking-tight"
								>42.5</span
							>
						</div>

						<div
							class="flex flex-col p-3 bg-slate-900/50 rounded-lg border border-slate-800/50"
						>
							<span
								class="text-[10px] text-primary/50 font-semibold uppercase tracking-wider mb-0.5"
								>Projects</span
							>
							<span class="text-lg font-black text-purple-400 tracking-tight"
								>7</span
							>
						</div>

						<div
							class="flex flex-col p-3 bg-slate-900/50 rounded-lg border border-slate-800/50"
						>
							<span
								class="text-[10px] text-primary/50 font-semibold uppercase tracking-wider mb-0.5"
								>Potion Mixes</span
							>
							<span class="text-lg font-black text-pink-400 tracking-tight"
								>14</span
							>
						</div>

						<div
							class="flex flex-col p-3 bg-slate-900/50 rounded-lg border border-slate-800/50"
						>
							<span
								class="text-[10px] text-primary/50 font-semibold uppercase tracking-wider mb-0.5"
								>Trust Factor</span
							>
							<span class="text-lg font-black text-amber-400 tracking-tight"
								>8<span class="text-xs text-amber-600 font-normal">/10</span
								></span
							>
						</div>
					</div> -->
				</div>
			</div>
		</div>
	</div>
</main>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 4px;
		height: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #27272a;
		border-radius: 2px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: #3f3f46;
	}
</style>
