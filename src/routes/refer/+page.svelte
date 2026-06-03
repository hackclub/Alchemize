<script lang="ts">
	import { onMount } from "svelte"
	import { navigating } from "$app/stores"

	const { data } = $props()
	let linkText = data.url
	console.log("Loaded referral page with data:", data)
	interface Refers {
		referer: string
		referedName: string
	}
	let loading = $state(true)
	let myReferals: Refers[] = data.myReferals
	let counts: Record<string, number> = data.counts
	//Sort counts by value in descending order
	let sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1])
	async function onCopy() {
		if (!linkText) return
		try {
			await navigator.clipboard.writeText(linkText)
			console.log("Copied:", linkText)
		} catch (err) {
			console.error("Copy failed:", err)
		}
	}
	onMount(() => {
		loading = false
	})
</script>
{#if loading || $navigating}
<div class="loading-screen w-screen h-screen bg-black flex items-center justify-center absolute top-0 z-20 flex-col gap-4">
	<div class="loader rounded-full size-26 border-2 border-t-red-600 animate-spin border-gray-700"></div>
	<span class="text-white text-lg ml-4">Loading your referrals...</span>
</div>
{/if}
<main
	class="flex gap-6 bg-gradbg p-6 w-screen h-screen overflow-hidden text-foreground"
>
	<div class="h-full w-[50%] flex flex-col gap-y-6">
		<div class="w-full flex items-center justify-between shadow-sm">
			<div
				class="bg-background/80 w-full py-3 px-4 flex items-center justify-start rounded-l-xl border border-primary"
			>
				<p id="ref-link" class="font-mono text-sm tracking-wide opacity-90">
					{linkText}
				</p>
			</div>
			<button
				class="h-full px-5 py-2.5 bg-primary rounded-r-xl font-medium shadow-sm hover:bg-primary/80 hover:scale-[1.02] transition-all duration-150 font-alchemize"
				onclick={onCopy}
			>
				Copy
			</button>
		</div>
		<div
			class="w-full flex-1 flex flex-col p-5 bg-background/40 rounded-3xl gap-3 min-h-0 shadow-lg backdrop-blur-sm"
		>
			<h1 class="font-alchemize text-2xl text-center mb-2 tracking-wide">
				Your Referrals
			</h1>
			<div class="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
				{#each myReferals as referal}
					<div
						class="w-full rounded-xl border border-primary/40 bg-background flex items-center justify-between gap-4 p-4 shadow-sm hover:border-primary/80 transition-all duration-200"
					>
						<p class="text-xl">{referal.referedName}</p>
					</div>
				{/each}
				{#if data.myReferals.length === 0}
					<p class="text-center text-lg opacity-80 mt-10">
						You haven't referred anyone yet. Share your link to start
						referring!
					</p>
				{/if}

			</div>
		</div>
	</div>
	<div class="h-full w-[50%] flex flex-col gap-y-6">
		<div
			class="w-full h-full flex flex-col p-5 bg-background/40 rounded-3xl gap-3 min-h-0 shadow-lg backdrop-blur-sm"
		>
			<h1 class="font-alchemize text-2xl text-center mb-2 tracking-wide">
				Top referers
			</h1>
			<div class="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
				{#each sortedCounts as [name, count]}
						<div
					class="w-full rounded-xl border border-primary/40 bg-background flex items-center justify-between gap-4 p-4 shadow-sm hover:border-primary/80 transition-all duration-200"
				>
					<p class="text-xl">{name}</p>
					<p class="text-xl font-bold text-primary">{count}</p>
				</div>
				{/each}
				{#if sortedCounts.length === 0}
					<p class="text-center text-lg opacity-80 mt-10">
						No referrals yet. Be the first to refer someone!
					</p>
				{/if}

			</div>
		</div>
	</div>
</main>
