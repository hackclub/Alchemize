<script>
	let { children } = $props()
</script>

<svelte:head>
	<title>Alchemize | Fulfillment</title>
	<meta name="description" content="Alchemize Fulfillment" />
	<meta property="og:title" content="Alchemize | Fulfillment" />
</svelte:head>

<main class="h-screen w-full p-5">
	<div class="flex h-full w-full gap-5 rounded-xl border-2 bg-black/40 p-2">
		{@render children()}
	</div>
</main>
