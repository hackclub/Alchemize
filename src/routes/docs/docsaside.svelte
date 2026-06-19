<script>
	import { ChevronDown } from "lucide-svelte"

	import { slide } from "svelte/transition"
	import { cn } from "$lib/lib/utils"

	import docsIndex from "./docs-index.json"

	const { toggleGroup, openGroups } = $props()
</script>

<aside
	class="relative z-10 sidebar h-screen min-w-1/4 max-w-80 border-primary p-5 border-r-2 shadow-[0_2_4px_red_inset]"
>
	<div
		class="sidebar-group flex items-center px-2 w-full pb-5 border-b-primary border-b"
	>
		<div class="">
			<span
				class="font-alchemize text-primary font-extrabold text-3xl tracking-tight"
				>ALCHEMIZE</span
			>
			<span
				class="font-extrabold leading-none tracking-wider text-xs uppercase font-mono"
			>
				Docs
			</span>
		</div>
	</div>
	{#each Object.entries(docsIndex) as [groupName, groupItems]}
		<div
			class="sidebar-group flex flex-col px-2 w-full gap-2 pt-5 pb-5 border-b-primary border-b"
		>
			<h1 class="text-xl w-full justify-between flex pr-4 mb-1 text-admin-text">
				{groupName}
				<button
					aria-label="Toggle submenu"
					class="hover:translate-y-px transition"
					onclick={() => toggleGroup(groupName)}
				>
					<ChevronDown
						class={cn(
							"transition-transform duration-200",
							!openGroups[groupName] && "-rotate-90"
						)}
					/>
				</button>
			</h1>
			{#if openGroups[groupName]}
				<div
					transition:slide={{ duration: 150 }}
					class="links flex gap-2 flex-col pl-3 text-neutral-300"
				>
					{#each groupItems as item}
						<a
							href={item.path}
							class="hover:text-primary hover:font-semibold cursor-pointer transition"
						>
							{item.name}
						</a>
					{/each}
				</div>
			{/if}
		</div>
	{/each}
</aside>
