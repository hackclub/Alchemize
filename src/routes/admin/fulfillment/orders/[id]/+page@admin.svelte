<script>
	import Button from "$lib/components/ui/button/button.svelte"
</script>

<main class="w-full min-h-screen flex items-center justify-center p-6 relative">
	<div class="fixed inset-0 bg-black/20 -z-10"></div>

	<div
		class="relative z-50 w-full max-w-2xl bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl space-y-6"
	>
		<div
			class="flex flex-col sm:flex-row items-start gap-6 border-b border-slate-700/40 pb-6"
		>
			<img
				src="/Alchemize-Admin.png"
				alt="Product Preview"
				class="h-44 w-44 object-contain p-4 bg-blue-900/30 border border-blue-500/30 rounded-xl shadow-inner flex-shrink-0 mx-auto sm:mx-0"
			/>

			<div class="flex flex-col gap-y-4 flex-1 w-full">
				<div>
					<h1
						class="text-3xl font-bold font-alchemize text-admin-text tracking-wide"
					>
						Cookie for Utkarsh
					</h1>
				</div>

				<div class="grid grid-cols-1 gap-y-1.5 text-admin-text">
					<div class="flex justify-between sm:justify-start gap-x-4">
						<span class="text-admin-text/70 font-medium w-28">Ordered on:</span>
						<span class="font-semibold">June 12, 2026</span>
					</div>
					<div class="flex justify-between sm:justify-start gap-x-4">
						<span class="text-admin-text/70 font-medium w-28">Ordered by:</span>
						<span class="font-semibold">Utkarsh</span>
					</div>
					<div class="flex justify-between sm:justify-start gap-x-4">
						<span class="text-admin-text/70 font-medium w-28">Total cost:</span>
						<span class="font-semibold text-emerald-400">10 potion mix</span>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-3 w-full pt-2">
					<Button
						class="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg transition-all"
					>
						Mark as Fulfilled
					</Button>
					<Button
						variant="outline"
						class="border-slate-600 hover:bg-slate-800 text-admin-text font-medium transition-all"
					>
						Mark as Unfulfilled
					</Button>
				</div>
			</div>
		</div>

		<div class="bg-slate-950/40 rounded-xl p-5 border border-slate-800/60">
			<h2
				class="text-xl font-bold font-alchemize text-admin-text mb-4 border-b border-slate-800 pb-2"
			>
				User Details: <span class="text-sm font-normal text-admin-text/60 ml-2"
					>(username goes here)</span
				>
			</h2>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-admin-text">
				<div
					class="flex flex-col p-3 bg-slate-900/40 rounded-lg border border-slate-800/40"
				>
					<span class="text-sm text-admin-text/60 font-medium">Total hours</span
					>
					<span class="text-xl font-bold text-blue-400">42.5</span>
				</div>
				<div
					class="flex flex-col p-3 bg-slate-900/40 rounded-lg border border-slate-800/40"
				>
					<span class="text-sm text-admin-text/60 font-medium"
						>Total projects</span
					>
					<span class="text-xl font-bold text-purple-400">7</span>
				</div>
				<div
					class="flex flex-col p-3 bg-slate-900/40 rounded-lg border border-slate-800/40"
				>
					<span class="text-sm text-admin-text/60 font-medium"
						>Total potion mixes</span
					>
					<span class="text-xl font-bold text-pink-400">14</span>
				</div>
				<div
					class="flex flex-col p-3 bg-slate-900/40 rounded-lg border border-slate-800/40"
				>
					<span class="text-sm text-admin-text/60 font-medium"
						>Hackatime trust factor</span
					>
					<span class="text-xl font-bold text-amber-400">8</span>
				</div>
			</div>
		</div>
	</div>
</main>
