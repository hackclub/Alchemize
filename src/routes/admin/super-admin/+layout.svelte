<script>
	import Aside from "./aside.svelte"
	let { children } = $props()
</script>

<main class="h-screen w-full p-5">
	<div class="flex h-full w-full gap-5 rounded-xl border-2 bg-black/20 p-2 backdrop-blur">
		<Aside />
		{@render children()}
	</div>
</main>
