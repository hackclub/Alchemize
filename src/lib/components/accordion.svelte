<script lang="ts">
	import { slide } from "svelte/transition"

	let { Title, Content, addClass } = $props()
	let open = $state(false)
</script>

<div class="flex flex-col w-full items-stretch justify-start group">
	<button
		onclick={() => (open = !open)}
		class="w-full flex items-center justify-between text-left px-5 py-4 border-2 border-zinc-800 bg-black/95 hover:bg-zinc-900/40 font-mono tracking-wide uppercase transition-colors rounded-none outline-none relative z-10 select-none {open
			? 'border-b-zinc-950'
			: ''} {addClass || ''}"
	>
		<h3
			class="text-sm md:text-base font-black text-white tracking-tight line-clamp-1 pr-8"
		>
			{Title}
		</h3>

		<span
			class="absolute right-5 font-mono font-black text-primary text-base md:text-lg select-none"
		>
			{#if open}
				&minus;
			{:else}
				&plus;
			{/if}
		</span>
	</button>

	{#if open}
		<div
			class="w-full border-2 border-t-0 border-zinc-800 bg-black/40 backdrop-blur-sm rounded-none relative z-0"
			transition:slide={{ duration: 200 }}
		>
			<div
				class="px-5 py-4 text-xs md:text-sm text-zinc-400 font-mono leading-relaxed tracking-normal border-t border-zinc-900/60 break-words"
			>
				{@html Content}
			</div>
		</div>
	{/if}
</div>
