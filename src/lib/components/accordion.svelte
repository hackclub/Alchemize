<script lang="ts">
	import { slide } from "svelte/transition"

	let { Title, Content } = $props()
	let open = $state(false)
</script>

<div class="group flex w-full flex-col items-stretch justify-start">
	<button
		onclick={() => (open = !open)}
		class="relative z-10 flex w-full items-center justify-between rounded-t-md border-2 border-border bg-card px-5 py-4 text-left font-display tracking-wide uppercase transition-colors outline-none select-none hover:bg-card/80 {open
			? 'rounded-b-none border-b-border'
			: 'rounded-b-md'}">
		<h3 class="line-clamp-1 pr-8 text-sm font-black tracking-tight text-card-foreground md:text-base">
			{Title}
		</h3>

		<span class="absolute right-5 font-body text-base font-black text-card-foreground select-none md:text-lg">
			{#if open}
				&minus;
			{:else}
				&plus;
			{/if}
		</span>
	</button>

	{#if open}
		<div
			class="relative z-0 w-full rounded-t-none rounded-b-md border-2 border-t-0 border-border bg-card/80 backdrop-blur-sm"
			transition:slide={{ duration: 200 }}>
			<div
				class="border-t border-border px-5 py-4 font-body text-xs leading-relaxed tracking-normal break-words text-card-foreground md:text-sm">
				{@html Content}
			</div>
		</div>
	{/if}
</div>
