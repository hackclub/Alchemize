<script lang="ts">
	import { page } from "$app/state"
	import docsIndex from "./docs-index.json"
	import Docsaside from "./docsaside.svelte"

	let { children } = $props()
	let isOutdatedSection = $derived(
		page.url.pathname.startsWith("/docs/themes/") || page.url.pathname.startsWith("/docs/stones-and-shops/")
	)

	const openGroups = $state<Record<string, boolean>>(
		Object.fromEntries(Object.keys(docsIndex).map(group => [group, true]))
	)

	function toggleGroup(group: string) {
		openGroups[group] = !openGroups[group]
	}
</script>

<svelte:head>
	<title>{isOutdatedSection ? "Docs section outdated" : "Alchemize | Docs"}</title>
	<meta
		name="description"
		content={isOutdatedSection
			? "This documentation section is outdated. Ask #alchemize-help on Slack for current information."
			: "Alchemize Docs"} />
	<meta property="og:title" content="Alchemize | Docs" />
</svelte:head>

<main class="flex h-screen max-h-screen overflow-hidden bg-background">
	<Docsaside {openGroups} {toggleGroup} />

	<div class="relative h-full max-h-screen w-full overflow-y-auto px-5 py-8 font-body sm:px-8 sm:py-10 lg:px-12">
		{#if isOutdatedSection}
			<div
				class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-6 py-10 text-center backdrop-blur-sm">
				<section
					role="dialog"
					aria-modal="true"
					aria-labelledby="outdated-docs-title"
					class="w-full max-w-lg space-y-5 rounded-xl border border-border bg-card p-8 shadow-xl">
					<h1 id="outdated-docs-title" class="font-display text-2xl font-bold text-foreground">
						This docs section is outdated
					</h1>
					<p class="text-muted-foreground">
						For current information, please ask in
						<a
							href="https://hackclub.enterprise.slack.com/archives/C0ASVK0HHEX"
							target="_blank"
							rel="noopener noreferrer"
							class="font-semibold text-primary underline underline-offset-4 hover:text-primary-hover">
							#alchemize-help
						</a>.
					</p>
					<a
						href="/docs/getting-started/introduction"
						class="inline-flex rounded-md border border-primary/50 bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition-colors hover:border-primary hover:text-primary">
						Back to current docs
					</a>
				</section>
			</div>
		{:else}
			{@render children()}
		{/if}
	</div>
</main>
