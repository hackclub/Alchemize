<script>
	import { ChevronDown } from "lucide-svelte"

	import { slide } from "svelte/transition"
	import { cn } from "$lib/lib/utils"

	import docsIndex from "./docs-index.json"
	import { ArrowLeft } from "@lucide/svelte"

	const { toggleGroup, openGroups } = $props()
</script>

<aside
	class="relative no-scrollbar z-10 h-full max-h-screen overflow-y-auto sidebar w-[clamp(450px,33vw,900px)] border-primary p-5 border-r-2 shadow-[0_2_4px_red_inset] scrollbar-none"
>
	<div
		class="sidebar-group flex items-center scrollbar-none w-full pb-5 border-b-primary border-b"
	>
		<div class="flex items-baseline gap-x-2">
			<a href="/dashboard" class="hover:text-primary hover:font-bold">
				<ArrowLeft />
			</a>
			<span
				class="font-alchemize text-primary font-extrabold sm:text-3xl text-3xl tracking-tight"
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

<style>
	@layer utilities {
		/* Hide scrollbar for Chrome, Safari and Opera */
		.no-scrollbar::-webkit-scrollbar {
			display: none;
		}
		/* Hide scrollbar for IE, Edge and Firefox */
		.no-scrollbar {
			-ms-overflow-style: none; /* IE and Edge */
			scrollbar-width: none; /* Firefox */
		}
	}
</style>
