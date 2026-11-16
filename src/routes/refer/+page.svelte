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
		class="loading-screen fixed inset-0 z-[100] flex h-screen w-full flex-col items-center justify-center gap-4 bg-black">
		<div class="loader h-16 w-16 animate-spin rounded-full border-2 border-zinc-800 border-t-primary"></div>
		<span class="animate-pulse font-mono text-sm tracking-widest text-zinc-400 uppercase">Loading Referrals...</span>
	</div>
{/if}

<svelte:head>
	<title>Alchemize | Refer</title>
	<meta name="description" content="Alchemize Refer" />
	<meta property="og:title" content="Alchemize | Refer" />
</svelte:head>

<a
	href="/dashboard"
	class="absolute top-5 left-5 z-10 self-start underline-offset-4 hover:text-primary hover:underline">
	<ArrowLeft class="size-7" />
</a>
<main class="flex h-screen w-full flex-col items-center gap-10 p-10 text-foreground select-none">
	<div class="flex flex-col items-center">
		<img src="/assets/Alchemize.png" alt="Alchemize" class="w-72 max-w-[80vw] object-contain" />
		<div class="mt-2 flex items-center gap-3">
			<span class="h-px w-8 bg-primary/60" aria-hidden="true"></span>
			<h1 class="font-note text-xs font-bold tracking-[0.3em] text-primary uppercase">Refer</h1>
			<span class="h-px w-8 bg-primary/60" aria-hidden="true"></span>
		</div>
	</div>
	<div
		class="flex w-[60%] items-center gap-4 rounded-md rounded-tl-2xl rounded-br-2xl border border-border bg-card p-3 shadow-sm shadow-primary">
		<div
			class="flex w-full scrollbar-none items-center justify-start overflow-x-auto rounded-lg border border-border/70 bg-secondary px-4 py-3 whitespace-nowrap text-secondary-foreground select-all">
			<p id="ref-link" class="font-mono text-xs tracking-wide md:text-sm">
				{linkText}
			</p>
		</div>
		<Button variant="primary" onclick={onCopy}>
			{copied ? "Copied!" : "Copy Link"}
		</Button>
	</div>

	<div class="relative z-10 grid min-h-0 w-full flex-1 grid-cols-1 items-stretch gap-6 px-10 lg:grid-cols-2">
		<div
			class="relative z-10 flex h-full w-full flex-col gap-4 overflow-hidden rounded-md rounded-tl-2xl rounded-br-2xl border-2 border-border bg-card p-5 shadow-sm shadow-primary">
			<h2
				class="flex items-center justify-between border-b border-border pb-3 font-display text-xl font-bold tracking-wider uppercase">
				Your Referrals:
				<span class="text-md rounded-md border border-border px-3 text-card-foreground">{referralCount}</span>
			</h2>

			<div class="relative z-20 flex min-h-0 flex-1 scrollbar-none flex-col gap-3 overflow-y-auto pr-1">
				{#each myReferals as referral}
					<div
						class="relative z-10 flex w-full items-center justify-between rounded-lg border border-border bg-secondary p-3 shadow-xs shadow-primary transition-all duration-150">
						<p class="font-mono text-sm tracking-wide text-secondary-foreground">
							{referral.referedName || referral.referedName}
						</p>
						<span
							class="rounded border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-[10px] tracking-wider text-primary"
							>Referred</span>
					</div>
				{/each}

				{#if myReferals.length === 0}
					<div class="flex flex-1 flex-col items-center justify-center py-12 text-center">
						<p class="max-w-[90%] font-note text-xs leading-relaxed text-card-foreground">No referrals yet...</p>
					</div>
				{/if}
			</div>
		</div>

		<div
			class="relative z-10 flex h-full w-full flex-col gap-4 overflow-hidden rounded-md rounded-tl-2xl rounded-br-2xl border-2 border-border bg-card p-5 shadow-sm shadow-primary">
			<h2 class="border-b border-border pb-3 font-display text-xl font-bold tracking-wider uppercase">
				Global Leaderboard
			</h2>

			<div class="relative z-20 flex min-h-0 flex-1 scrollbar-none flex-col gap-3 overflow-y-auto pr-1">
				{#each sortedCounts as [name, count], index}
					<div
						class="relative z-10 flex w-full items-center justify-between rounded-lg border border-border bg-secondary p-3 text-secondary-foreground shadow-sm shadow-primary">
						<div class="flex items-center gap-3">
							<span
								class="z-10 flex min-w-8 items-center justify-center rounded border border-primary/60 bg-primary/40 px-2 py-0.5 font-note text-[10px] font-black">
								#{index + 1}
							</span>
							<p class="font-display text-sm font-medium">
								{name}
							</p>
						</div>
						<p class="font-display text-base font-black">
							{count}
						</p>
					</div>
				{/each}

				{#if sortedCounts.length === 0}
					<div class="flex flex-1 flex-col items-center justify-center py-12 text-center">
						<p class="max-w-[200px] font-mono text-xs leading-relaxed text-zinc-500">No referrals yet....</p>
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
