<script lang="ts">
	import { onMount } from "svelte"
	import { navigating } from "$app/stores"

	const { data } = $props()
	let linkText = data.url
	console.log("Loaded referral page with data:", data)

	let loading = $state(true)
	let copied = $state(false)

	let myReferals = data.myReferals
	let counts: Record<string, number> = data.counts

	let sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1])

	let referralCount = $derived(myReferals.length)

	const rewards: any = [
		// { name: "Test", required: 1, icon: "✨" }
	]

	async function onCopy() {
		try {
			await navigator.clipboard.writeText(linkText)
			copied = true
			setTimeout(() => {
				copied = false
			}, 2000)
		} catch (err) {
			console.error("Copy failed:", err)
		}
	}

	onMount(() => {
		loading = false
	})
</script>

{#if loading || $navigating}
	<div
		class="loading-screen w-full h-screen bg-black flex items-center justify-center fixed inset-0 z-[100] flex-col gap-4"
	>
		<div
			class="loader rounded-full w-16 h-16 border-2 border-t-primary animate-spin border-zinc-800"
		></div>
		<span
			class="text-zinc-400 font-mono text-sm tracking-widest uppercase animate-pulse"
			>Loading Referrals...</span
		>
	</div>
{/if}

<main
	class="w-full h-screen max-h-screen bg-gradbg text-foreground p-4 md:p-6 flex flex-col justify-between select-none mx-auto relative z-10 overflow-hidden"
>
	<div
		class="w-full flex flex-col md:flex-row items-stretch gap-4 bg-zinc-950/60 backdrop-blur-md p-3 rounded-xl border border-zinc-800 shadow-xl relative z-20 flex-shrink-0"
	>
		<div
			class="flex items-center px-4 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono tracking-wider text-zinc-400 uppercase"
		>
			Your Invite Link
		</div>
		<div
			class="bg-zinc-900/90 w-full py-3 px-4 flex items-center justify-start rounded-lg border border-primary/30 select-all overflow-x-auto whitespace-nowrap scrollbar-none"
		>
			<p
				id="ref-link"
				class="font-mono text-xs md:text-sm tracking-wide text-zinc-300"
			>
				{linkText}
			</p>
		</div>
		<button
			class="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold uppercase tracking-widest text-xs transition-all duration-150 font-mono active:scale-[0.98] flex items-center justify-center min-w-[140px] shadow-lg shadow-primary/10 relative z-30"
			class:bg-emerald-600={copied}
			class:text-white={copied}
			onclick={onCopy}
		>
			{copied ? "Copied!" : "Copy Link"}
		</button>
	</div>

	<div
		class="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full flex-1 items-stretch relative z-10 min-h-0 mt-4 mb-2"
	>
		<!-- <div class="relative w-full group flex flex-col h-full min-h-0 z-10">
			<div
				class="absolute inset-0 bg-primary translate-x-1 translate-y-1 rounded-xl transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5 z-0"
			></div>
			<div
				class="w-full h-full flex flex-col p-5 bg-zinc-950 rounded-xl gap-4 border-primary/40 border-2 shadow-2xl relative z-10 overflow-hidden"
			>
				<div class="flex-shrink-0">
					<h2
						class="font-alchemize text-xl tracking-wider uppercase border-b pb-3"
					>
						Rewards!
					</h2>
				</div>

				<div
					class="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 relative z-20 scrollbar-none min-h-0"
				>
					{#if rewards.length > 0}
						{#each rewards as reward}
							{@const unlocked = referralCount >= reward.required}
							<div
								class="p-3 rounded-lg border flex items-center justify-between gap-3 transition-all duration-200 relative flex-shrink-0
                            {unlocked
									? 'bg-primary/5 border-primary/40'
									: 'bg-zinc-900/40 border-zinc-900 opacity-60'}"
							>
								<div class="flex items-center gap-3">
									<span class="text-2xl">{reward.icon}</span>
									<div class="flex flex-col">
										<span
											class="text-sm font-medium font-mono tracking-tight text-zinc-200"
											>{reward.name}</span
										>
										<span
											class="text-[10px] font-mono uppercase tracking-wider text-zinc-500"
											>Requires {reward.required}
											{reward.required === 1 ? "referral" : "referrals"}</span
										>
									</div>
								</div>
								<div>
									{#if unlocked}
										<span
											class="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest"
											>Unlocked</span
										>
									{:else}
										<span
											class="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700/30 uppercase tracking-widest"
											>Locked</span
										>
									{/if}
								</div>
							</div>
						{/each}
					{:else}
						<div
							class="text-center w-full h-full text-muted-foreground font-mono pt-10"
						>
							Rewards coming soon!
						</div>
					{/if}
				</div>
			</div>
		</div> -->

		<div class="relative w-full group flex flex-col h-full min-h-0 z-10">
			<div
				class="absolute inset-0 bg-primary translate-x-1 translate-y-1 rounded-xl transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5 z-0"
			></div>
			<div
				class="w-full h-full flex flex-col p-5 bg-zinc-950 rounded-xl gap-4 border-primary/40 border-2 shadow-2xl relative z-10 overflow-hidden"
			>
				<h2
					class="font-alchemize text-xl tracking-wider uppercase border-b border-zinc-900 pb-3 flex-shrink-0 flex items-center justify-between"
				>
					Your Referrals:
					<span class="text-md px-3 font-bold text-primary border rounded-md"
						>{referralCount}</span
					>
				</h2>

				<div
					class="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 relative z-20 scrollbar-none min-h-0"
				>
					{#each myReferals as referral}
						<div class="relative flex-shrink-0 w-full p-[1px]">
							<div class="absolute inset-0 bg-primary/10 rounded-lg z-0"></div>
							<div
								class="relative z-10 w-full rounded-lg border border-zinc-900 bg-zinc-900/60 flex items-center justify-between p-3.5 shadow-sm hover:border-primary/40 transition-all duration-150"
							>
								<p class="text-sm font-mono tracking-wide text-zinc-300">
									{referral.referedName || referral.referedName}
								</p>
								<span
									class="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 tracking-wider"
									>Referred</span
								>
							</div>
						</div>
					{/each}

					{#if myReferals.length === 0}
						<div
							class="flex flex-col items-center justify-center flex-1 py-12 text-center"
						>
							<p
								class="text-zinc-500 font-mono text-xs max-w-[200px] leading-relaxed"
							>
								No referrals yet...
							</p>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<div class="relative w-full group flex flex-col h-full min-h-0 z-10">
			<div
				class="absolute inset-0 bg-primary translate-x-1 translate-y-1 rounded-xl transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5 z-0"
			></div>
			<div
				class="w-full h-full flex flex-col p-5 bg-zinc-950 rounded-xl gap-4 border-primary/40 border-2 shadow-2xl relative z-10 overflow-hidden"
			>
				<h2
					class="font-alchemize text-xl tracking-wider uppercase border-b border-zinc-900 pb-3 flex-shrink-0"
				>
					Global Leaderboard
				</h2>

				<div
					class="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 relative z-20 scrollbar-none min-h-0"
				>
					{#each sortedCounts as [name, count], index}
						<div class="relative flex-shrink-0 w-full p-[1px]">
							<div class="absolute inset-0 bg-primary/10 rounded-lg z-0"></div>
							<div
								class="relative z-10 w-full rounded-lg border border-zinc-900 bg-zinc-900/60 flex items-center justify-between p-3.5 shadow-sm hover:border-primary/40 transition-all duration-150"
							>
								<div class="flex items-center gap-3">
									<span
										class="font-mono text-[10px] font-black px-2 py-0.5 rounded flex items-center justify-center min-w-8 z-10
                                        {index === 0
											? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
											: ''}
                                        {index === 1
											? 'bg-zinc-400/20 text-zinc-300 border border-zinc-400/30'
											: ''}
                                        {index === 2
											? 'bg-amber-700/20 text-amber-600 border border-amber-700/30'
											: ''}
                                        {index > 2
											? 'bg-zinc-800 text-zinc-500 border border-zinc-700/20'
											: ''}"
									>
										#{index + 1}
									</span>
									<p class="text-sm font-mono font-medium text-zinc-300">
										{name}
									</p>
								</div>
								<p class="text-base font-mono font-black text-primary">
									{count}
								</p>
							</div>
						</div>
					{/each}

					{#if sortedCounts.length === 0}
						<div
							class="flex flex-col items-center justify-center flex-1 py-12 text-center"
						>
							<p
								class="text-zinc-500 font-mono text-xs max-w-[200px] leading-relaxed"
							>
								No referrals yet....
							</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</main>

<style>
	/* Completely hide scrollbar track visuals to prevent overflow leaks */
	.scrollbar-none::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-none {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
