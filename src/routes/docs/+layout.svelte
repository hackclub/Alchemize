<script lang="ts">
	import docsIndex from "./docs-index.json"
	let { children } = $props()
</script>

<div
	class="fixed -z-20  bg-cover bg-center w-screen h-screen blur-sm"
></div>
<main class="body flex font-alchemize">
	<div class="fixed inset-0 bg-black z-0 pointer-events-none"></div>
	<div
		class="absolute inset-0 z-0 bg-[linear-gradient(to_right,#6080600a_1px,transparent_2px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-80"
	></div>
	<aside
		class="relative bg-black z-10 sidebar h-screen min-w-1/4 max-w-80 border-primary p-5 border-r-2 shadow-[0_2_4px_red_inset]"
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
				<h1
					class="text-xl w-full justify-between flex pr-4 mb-1 text-admin-text"
				>
					{groupName}
					<button
						aria-label="Toggle submenu"
						class="hover:translate-y-px transition"
					>
						<i class="fa-solid fa-angle-down"></i>
					</button>
				</h1>
				<div class="links flex gap-2 flex-col pl-3 text-neutral-300">
					{#each groupItems as item}
						<a
							href={item.path}
							class="hover:text-primary hover:font-semibold cursor-pointer transition"
							>{item.name}</a
						>
					{/each}
				</div>
			</div>
		{/each}
	</aside>
	<div class="relative min-h-full w-full p-10 font-light text-admin-text">
		{@render children()}
	</div>
</main>
