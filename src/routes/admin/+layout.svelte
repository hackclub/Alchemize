<script lang="ts">
	import { page } from "$app/state"
	import Adminnav from "$lib/components/adminnav.svelte"
	import { loaderStore } from "$lib/stores/adminLoader"
	import { navigating } from "$app/stores"

	let { children, data } = $props()
	const excludedRoutes = ["/admin", "/admin/login", "/admin/error"]
	const colorRoutes = "/admin/review2/"
	const adminPrimary = $state("#6875f6")
	const adminHover = $state("#7a8aff")
	const adminText = $state("#edf2ff")
	let adminBg = $state("#172554")
	let admin2Bg = $state("#0C4A6E")
	if (page.url.pathname.includes(colorRoutes)) {
		adminBg = "#171714"
		admin2Bg = "#030303"
	}
</script>

<div
	class="h-screen w-screen"
	style="
		--primary: {adminPrimary};
		--primary-hover: {adminHover};
		--primary-foreground: {adminText};
		--foreground: {adminText};
		--background: {adminBg};
		--card: {adminBg};
		--secondary: {admin2Bg};
		--secondary-foreground: {adminText};
		--muted-foreground: {adminText};
		--border: {adminPrimary};
	">
	{@render children()}
</div>

{#if !excludedRoutes.includes(page.url.pathname)}
	<Adminnav admin={data.admin} />
{/if}
{#if $navigating || $loaderStore}
	<div class="fixed inset-0 z-80 flex items-center justify-center bg-black/70 backdrop-blur-none">
		<div class="flex flex-col items-center gap-4">
			<div class="h-12 w-12 animate-spin rounded-full border-4 border-gray-600 border-t-primary"></div>
			<p class="text-lg text-primary-foreground">Loading...</p>
		</div>
	</div>
{/if}
