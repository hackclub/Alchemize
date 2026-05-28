<script>
	import { page } from "$app/state"
	import Adminnav from "$lib/components/adminnav.svelte"

	let { children } = $props()
	const excludedRoutes = ["/admin", "/admin/login"]
</script>

<div class="bg-admin fixed w-screen h-screen -z-10">
	<div class="fixed inset-0 bg-black/60 -z-20"></div>
	<div class="bg fixed w-screen h-screen -z-10"></div>
</div>
{@render children()}
{#if !excludedRoutes.includes(page.url.pathname)}
	<Adminnav />
{/if}

<style>
	.bg {
		background-image: linear-gradient(#ffffff13 1px, #0000 0),
			linear-gradient(90deg, #ffffff13 1px, #0000 0);
		background-size: 40px 40px;
	}
</style>
