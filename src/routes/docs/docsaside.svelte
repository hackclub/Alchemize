<script>
	import { ChevronDown } from "lucide-svelte"

	import { slide } from "svelte/transition"
	import { cn } from "$lib/lib/utils"

	import docsIndex from "./docs-index.json"
	import { ArrowLeft } from "@lucide/svelte"
	import Button from "$lib/components/ui/button/button.svelte"

	const { toggleGroup, openGroups } = $props()
</script>

<aside class="sidebar relative z-10 h-full max-h-screen w-1/4 scrollbar-none overflow-y-auto border-r bg-card p-5">
	<div class="sidebar-group flex w-full scrollbar-none flex-col items-center gap-2 border-b pb-5">
		<div class="flex w-full justify-center pb-2">
			<img src="/assets/DOCS.png" alt="Docs" class="block h-auto w-full max-w-[220px] object-contain" />
		</div>
		<a href="/dashboard" class="w-full">
			<Button variant="secondary" size="sm" class="w-full">Back to site</Button>
		</a>
	</div>
	{#each Object.entries(docsIndex) as [groupName, groupItems]}
		<div class="sidebar-group flex w-full flex-col gap-2 border-b px-2 pt-5 pb-5">
			<h1 class="text-md mb-1 flex w-full justify-between font-semibold text-card-foreground">
				{groupName}
				<button
					aria-label="Toggle submenu"
					class="transition hover:translate-y-px"
					onclick={() => toggleGroup(groupName)}>
					<ChevronDown class={cn("transition-transform duration-200", !openGroups[groupName] && "-rotate-90")} />
				</button>
			</h1>
			{#if openGroups[groupName]}
				<div
					transition:slide={{ duration: 150 }}
					class="links flex flex-col gap-2 pl-3 font-note text-secondary-foreground">
					{#each groupItems as item}
						<a
							href={item.path}
							class="cursor-pointer underline-offset-4 transition hover:text-card-foreground hover:underline">
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
		.scrollbar-none::-webkit-scrollbar {
			display: none;
		}
		.scrollbar-none {
			-ms-overflow-style: none;
			scrollbar-width: none;
		}
	}
</style>
