<script lang="ts">
	import { marked } from "marked"
	import "../../docsMd.css"
	import docsIndex from "../../docs-index.json"

	interface DocItem {
		name: string
		path: string
		filePath?: string
	}

	interface DocsIndex {
		[group: string]: DocItem[]
	}

	let { params } = $props()
	let subgroup = $derived(params.subgroup as string)
	let doc = $derived(params.doc as string)
	let indexSearch = $derived("/docs/" + subgroup + "/" + doc)

	const markdownFiles = import.meta.glob<string>("../../**/*.md", { eager: true, query: "?raw", import: "default" })

	let docItem = $derived(
		Object.values(docsIndex as DocsIndex)
			.flat()
			.find(item => item.path === indexSearch)
	)
	let docTitle = $derived(docItem?.name ?? null)
	let markdownContent = $derived.by(() => {
		const filePath = docItem?.filePath
		if (!filePath) return ""
		const cleanedPath = filePath.startsWith("/") ? filePath.slice(1) : filePath
		const targetKey = Object.keys(markdownFiles).find(key => key.endsWith(cleanedPath))
		return targetKey ? markdownFiles[targetKey] : `Doc not found: ${filePath}`
	})

	let html = $derived(marked.parse(markdownContent))
</script>

<svelte:head>
	<title>{docTitle ?? "Docs"} - Alchemize Docs</title>
</svelte:head>

<article class="md">
	{#if html}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- rendered from the markdown files bundled with the app, not from user input -->
		{@html html}
	{:else}
		<p>Loading doc...</p>
	{/if}
</article>
