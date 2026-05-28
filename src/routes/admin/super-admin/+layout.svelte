<script>
	import Aside from "./aside.svelte"
	let { children } = $props()
</script>

<main class="h-screen w-full p-5">
	<div
		class="h-full w-full rounded-xl bg-black/20 backdrop-blur border-2 p-2 flex gap-5"
	>
		<Aside />
		{@render children()}
	</div>
</main>
