<script lang="ts">
    import docsIndex from './docs-index.json';
	let { children } = $props()

</script>

<main class="body flex font-alchemize">
	<div
		class="ml-20 sidebar h-screen w-1/3 max-w-80 border-primary pt-4 pr-5 border-r-4 shadow-[0_2_4px_red_inset]"
	>
		<div
			class="sidebar-group flex items-center px-2 w-full pb-5 border-b-primary border-b"
		>
			<div class="">
				<span
					class="font-alchemize text-primary font-extrabold text-3xl tracking-tight"
					>ALCHEMIZE</span
				> <span class="font-alchemize font-extrabold text-xs">Docs</span>
			</div>
		</div>
        {#each Object.entries(docsIndex) as [groupName, groupItems]}
        		<div
			class="sidebar-group flex flex-col px-2 w-full gap-2 pt-5 pb-5 border-b-primary border-b"
		>
			<h1 class="text-xl w-full justify-between flex pr-4 mb-4">
				{groupName}
				<button aria-label="Toggle submenu"
					><i class="fa-solid fa-angle-down"></i></button
				>
			</h1>
			<div class="links flex gap-2 flex-col pl-3 text-neutral-300">
				{#each groupItems as item}
                <a href="{item.path}" class="docName">{item.name}</a>
                {/each}
			</div>
		</div>
            
        {/each}
        
	</div>
	{@render children()}
</main>

<style>
	.docName {
		cursor: pointer;
	}
	.docName:hover {
		color: var(--primary);
	}
</style>
