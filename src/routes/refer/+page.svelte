<script lang="ts">
	import { onMount } from "svelte"
	import { navigating } from "$app/stores"
	import { ArrowLeft } from "lucide-svelte"
	import Button from "$lib/components/ui/button/button.svelte"

	const { data } = $props()
	let linkText = data.url

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

<svelte:head>
	<title>Alchemize | Refer</title>
	<meta name="description" content="Alchemize Refer" />
	<meta property="og:title" content="Alchemize | Refer" />
</svelte:head>

<a
	href="/dashboard"
	class="self-start absolute z-10 top-5 left-5 hover:text-primary hover:font-bold"
>
	<ArrowLeft class="size-7" />
</a>
<main
	class="w-full h-screen text-foreground p-10 flex flex-col gap-10 items-center select-none"
>
	<h1
		class="font-black font-decor text-4xl text-foreground uppercase tracking-tighter flex flex-col items-center gap-1"
	>
		Alchemize
		<span class="uppercase font-display font-medium text-sm">Refer</span>
	</h1>
	<div
		class="w-[60%] flex items-center gap-4 bg-card p-3 rounded-tl-2xl rounded-br-2xl rounded-md border border-border shadow-sm shadow-primary"
	>
		<div
			class="bg-secondary text-secondary-foreground w-full py-3 px-4 flex items-center justify-start rounded-lg border border-border/70 select-all overflow-x-auto whitespace-nowrap scrollbar-none"
		>
			<p id="ref-link" class="font-mono text-xs md:text-sm tracking-wide">
				{linkText}
			</p>
		</div>
		<Button variant="primary" onclick={onCopy}>
			{copied ? "Copied!" : "Copy Link"}
		</Button>
	</div>

	<div
		class="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full flex-1 items-stretch relative z-10 min-h-0 px-10"
	>
		<div
			class="w-full h-full flex flex-col p-5 bg-card rounded-tl-2xl rounded-br-2xl rounded-md gap-4 border-border border-2 shadow-sm shadow-primary relative z-10 overflow-hidden"
		>
			<h2
				class="font-display font-bold text-xl tracking-wider uppercase border-b border-border pb-3 flex items-center justify-between"
			>
				Your Referrals:
				<span
					class="text-md px-3 text-card-foreground border border-border rounded-md"
					>{referralCount}</span
				>
			</h2>

			<div
				class="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 relative z-20 scrollbar-none min-h-0"
			>
				{#each myReferals as referral}
					<div
						class="relative z-10 w-full rounded-lg border border-border bg-secondary flex items-center justify-between p-3 shadow-xs shadow-primary transition-all duration-150"
					>
						<p
							class="text-sm font-mono tracking-wide text-secondary-foreground"
						>
							{referral.referedName || referral.referedName}
						</p>
						<span
							class="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 tracking-wider"
							>Referred</span
						>
					</div>
				{/each}

				{#if myReferals.length === 0}
					<div
						class="flex flex-col items-center justify-center flex-1 py-12 text-center"
					>
						<p
							class="text-card-foreground font-note text-xs max-w-[90%] leading-relaxed"
						>
							No referrals yet...
						</p>
					</div>
				{/if}
			</div>
		</div>

		<div
			class="w-full h-full flex flex-col p-5 bg-card rounded-tl-2xl rounded-br-2xl rounded-md gap-4 border-border border-2 shadow-sm shadow-primary relative z-10 overflow-hidden"
		>
			<h2
				class="font-display font-bold text-xl tracking-wider uppercase border-b border-border pb-3"
			>
				Global Leaderboard
			</h2>

			<div
				class="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 relative z-20 scrollbar-none min-h-0"
			>
				{#each sortedCounts as [name, count], index}
					<div
						class="relative z-10 w-full rounded-lg border border-border bg-secondary text-secondary-foreground flex items-center justify-between p-3 shadow-sm shadow-primary"
					>
						<div class="flex items-center gap-3">
							<span
								class="font-note text-[10px] font-black px-2 py-0.5 rounded flex items-center justify-center min-w-8 z-10 bg-primary/40 border border-primary/60"
							>
								#{index + 1}
							</span>
							<p class="text-sm font-display font-medium">
								{name}
							</p>
						</div>
						<p class="text-base font-display font-black">
							{count}
						</p>
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
