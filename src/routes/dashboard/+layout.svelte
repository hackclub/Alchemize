<script lang="ts">
	import Navigation from "$lib/components/navigation.svelte"
	import { navigating } from "$app/stores"
	import { page } from "$app/state"
	import { browser } from "$app/environment"
	import { loaderStore } from "$lib/stores/loader"
	import { hackatimeAuthUrl } from "$lib/utils"
	import type { LayoutData } from "./$types"
	import Button from "$lib/components/ui/button/button.svelte"

	let { children, data }: { children: any; data: LayoutData & { admin?: boolean } } = $props()

	const isAllowed = $derived(data?.allowed ?? false)
	const reLogin = $derived(data?.relogin ?? false)
	const reHackatime = $derived(data?.reHackatime ?? false)
	const excludedRoutes = ["/dashboard"]
	let unVerified = $state(false)
</script>

<svelte:head><link rel="icon" href="/pmix_v2.png" /></svelte:head>

{#if $navigating || $loaderStore}
	<div class="fixed inset-0 z-80 flex items-center justify-center bg-black/80 backdrop-blur-none">
		<div class="flex flex-col items-center gap-4">
			<div class="h-12 w-12 animate-spin rounded-full border-2 border-primary-foreground border-t-primary"></div>
			<p class="font-mono text-xl text-primary">Loading...</p>
		</div>
	</div>
{/if}

{#if !isAllowed}
	<div class="bg-opacity-50 pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black">
		<div class="flex flex-col items-center gap-4">
			<div class="h-12 w-12 animate-spin rounded-full border-4 border-gray-600 border-t-red-600"></div>
			<p class="text-lg text-primary-foreground">The Dashboard is currently Locked Sorry</p>
		</div>
	</div>
{/if}

<div class="bg-scale fixed inset-0 z-[-1] scale-103 bg-[url('/bg-pattern-outline.png')] bg-contain opacity-50"></div>
<div class="bg-scale fixed inset-0 z-0 bg-background/95 bg-contain"></div>
<div class="root relative z-10 flex h-screen w-screen items-center justify-start text-primary-foreground">
	{#if !excludedRoutes.includes(page.url.pathname) && page.url.pathname !== "/dashboard/projects"}
		<Navigation />
	{/if}
	{#if unVerified}
		<div
			class="absolute top-0 left-0 z-10 flex h-screen w-screen flex-col items-center justify-center bg-black backdrop-opacity-50">
			<span class="font-mono text-xl text-primary">Hey! We need you to login with hackatime to access this</span>
			<br />
			<a class="z-9999" href={hackatimeAuthUrl} target="_blank">
				<Button size="lg">Login Via Hackatime</Button>
			</a>
		</div>
	{/if}
	{#if isAllowed && !unVerified}
		{@render children()}
	{/if}
</div>
