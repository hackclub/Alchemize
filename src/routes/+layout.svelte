<script lang="ts">
	import "./layout.css"

	let { children } = $props()
</script>

<svelte:head><link rel="icon" href="/Alchemist.webp" /></svelte:head>
{@render children()}
