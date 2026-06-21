<script>
	let { children } = $props()
</script>

<svelte:head>
	<title>Alchemize | Fulfillment</title>
	<meta name="description" content="Alchemize Fulfillment" />
	<meta property="og:title" content="Alchemize | Fulfillment" />
</svelte:head>

<main class="h-screen w-full p-5">
	<div class="h-full w-full rounded-xl bg-black/40 border-2 p-2 flex gap-5">
		{@render children()}
	</div>
</main>
