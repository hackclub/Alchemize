<script>
	import Button from "$lib/components/ui/button/button.svelte"
	import {
		MapPin,
		PackageCheck,
		Calendar,
		User,
		Coins,
		Undo2,
	} from "lucide-svelte"
</script>

<a
	href="/admin/fulfillment"
	class="absolute top-2 left-2 hover:bg-zinc-900 p-1 rounded-md z-50"
>
	<Undo2 />
</a>

<main
	class="w-full h-full max-h-screen overflow-hidden flex items-center justify-center p-4 md:p-8 relative text-admin-text"
>
	<div
		class="relative z-50 w-full max-w-5xl h-[85vh] bg-slate-900/70 backdrop-blur-md border border-slate-700/40 rounded-2xl shadow-2xl grid grid-cols-1 md:grid-cols-2 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-800/60"
	>
		<div class="p-6 md:p-8 flex flex-col justify-between h-full">
			<div class="space-y-6">
				<div
					class="flex justify-center bg-slate-950/40 p-6 rounded-xl border border-slate-800/50 shadow-inner"
				>
					<img
						src="/Alchemize-Admin.png"
						alt="Product Preview"
						class="h-48 w-48 object-contain"
					/>
				</div>

				<h1
					class="text-3xl font-extrabold font-alchemize tracking-wide text-center md:text-left"
				>
					Cookie for Utkarsh
				</h1>

				<div
					class="space-y-3 bg-slate-950/30 p-4 rounded-xl border border-slate-800/40 text-sm"
				>
					<div class="flex items-center gap-3">
						<Calendar class="w-4 h-4 text-slate-400" />
						<span class="text-admin-text/60 w-24">Ordered on:</span>
						<span class="font-semibold text-zinc-200">June 12, 2026</span>
					</div>
					<div class="flex items-center gap-3">
						<User class="w-4 h-4 text-slate-400" />
						<span class="text-admin-text/60 w-24">Ordered by:</span>
						<span class="font-semibold text-zinc-200">Utkarsh</span>
					</div>
					<div class="flex items-center gap-3">
						<Coins class="w-4 h-4 text-emerald-500" />
						<span class="text-admin-text/60 w-24">Total cost:</span>
						<span class="font-bold text-emerald-400">10 potion mix</span>
					</div>
				</div>
			</div>

			<div
				class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 border-t border-slate-800/40 mt-6"
			>
				<Button
					class="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg transition-all w-full"
				>
					Mark as Fulfilled
				</Button>
				<Button
					variant="outline"
					class="border-slate-700 hover:bg-slate-800 text-admin-text font-medium transition-all w-full"
				>
					Mark as Unfulfilled
				</Button>
			</div>
		</div>

		<div class="p-6 md:p-8 flex flex-col gap-y-6 h-full bg-slate-950/20">
			<div
				class="bg-slate-950/40 rounded-xl p-5 border border-slate-800/60 space-y-4 shadow-sm"
			>
				<div
					class="flex items-center gap-2 border-b border-slate-800/80 pb-2.5"
				>
					<MapPin class="w-4 h-4 text-amber-500" />
					<h2 class="text-base font-bold font-alchemize">Shipping Address</h2>
				</div>

				<div class="space-y-3 text-sm">
					<div class="space-y-0.5">
						<span
							class="text-[11px] font-semibold text-admin-text/40 uppercase tracking-wider block"
							>Recipient</span
						>
						<p class="font-semibold text-zinc-200">Utkarsh Chandel</p>
						<p class="text-xs text-admin-text/50 font-mono">TheUtkarsh8939</p>
					</div>

					<div class="space-y-0.5 pt-1">
						<span
							class="text-[11px] font-semibold text-admin-text/40 uppercase tracking-wider block"
							>Destination</span
						>
						<p class="text-zinc-200 leading-relaxed font-medium">
							1234 xyz, abcdefgh, ijklmnop, qrstuvqxyz
						</p>
						<p class="text-zinc-400 text-xs">
							State, Country — <span class="font-mono text-zinc-300"
								>Zipcode</span
							>
						</p>
					</div>
				</div>
			</div>

			<div
				class="bg-slate-950/40 rounded-xl p-5 border border-slate-800/60 space-y-4 flex-1 flex flex-col justify-between shadow-sm"
			>
				<div>
					<div
						class="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-4"
					>
						<div class="flex items-center gap-2">
							<PackageCheck class="w-4 h-4 text-indigo-400" />
							<h2 class="text-base font-bold font-alchemize">User Analytics</h2>
						</div>
						<span
							class="text-[10px] bg-slate-800 text-admin-text/70 px-2 py-0.5 rounded-md border border-slate-700/40 font-mono"
						>
							@TheUtkarsh8939
						</span>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div
							class="flex flex-col p-3 bg-slate-900/50 rounded-lg border border-slate-800/50"
						>
							<span
								class="text-[10px] text-admin-text/50 font-semibold uppercase tracking-wider mb-0.5"
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
								class="text-[10px] text-admin-text/50 font-semibold uppercase tracking-wider mb-0.5"
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
								class="text-[10px] text-admin-text/50 font-semibold uppercase tracking-wider mb-0.5"
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
								class="text-[10px] text-admin-text/50 font-semibold uppercase tracking-wider mb-0.5"
								>Trust Factor</span
							>
							<span class="text-lg font-black text-amber-400 tracking-tight"
								>8<span class="text-xs text-amber-600 font-normal">/10</span
								></span
							>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</main>
