<script lang="ts">
	import docsIndex from "./docs-index.json"
	import Docsaside from "./docsaside.svelte"

	let { children } = $props()

	let openGroups = $state<Record<string, boolean>>(
		Object.fromEntries(Object.keys(docsIndex).map(group => [group, true]))
	)

	function toggleGroup(group: string) {
		openGroups[group] = !openGroups[group]
	}
</script>

<svelte:head>
	<title>Alchemize | Docs</title>
	<meta name="description" content="Alchemize Docs" />
	<meta property="og:title" content="Alchemize | Docs" />
</svelte:head>

<main
	class="body flex font-alchemize selection:bg-primary selection:text-primary-foreground h-screen max-h-screen overflow-hidden bg-background"
>
	<div class="fixed inset-0 bg-black/50 z-0 pointer-events-none"></div>
	<div
		class="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_2px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-80"
	></div>

	<Docsaside {openGroups} {toggleGroup} />

	<div
		class="relative h-full max-h-screen w-full overflow-y-auto p-10 font-light text-admin-text"
	>
		{@render children()}
	</div>
</main>
