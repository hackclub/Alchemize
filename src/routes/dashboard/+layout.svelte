<script lang="ts">
	import Navigation from "$lib/components/navigation.svelte"
	import { navigating } from "$app/stores"
	import { page } from "$app/state"
	import { browser } from "$app/environment"
	import { loaderStore } from "$lib/stores/loader"
	import { scopes } from "$lib/utils"
	import {
		PUBLIC_HACKATIME_AUTH,
		PUBLIC_HACKATIME_REDIRECT,
		PUBLIC_HACKCLUB_AUTH,
		PUBLIC_HACKCLUB_REDIRECT,
	} from "$env/static/public"
	import type { LayoutData } from "./$types"
	import Button from "$lib/components/ui/button/button.svelte"

	let {
		children,
		data,
	}: { children: any; data: LayoutData & { admin?: boolean } } = $props()

	const isAllowed = $derived(data?.allowed ?? false)
	const reLogin = $derived(data?.relogin ?? false)
	const reHackatime = $derived(data?.reHackatime ?? false)
	const hackatimeAuthUrl = `https://hackatime.hackclub.com/oauth/authorize?client_id=${PUBLIC_HACKATIME_AUTH}&redirect_uri=${encodeURIComponent(PUBLIC_HACKATIME_REDIRECT)}&response_type=code&scope=profile+read`
	const authUrl = `https://auth.hackclub.com/oauth/authorize?client_id=${PUBLIC_HACKCLUB_AUTH}&response_type=code&scope=${scopes}&redirect_uri=${encodeURIComponent(PUBLIC_HACKCLUB_REDIRECT)}`
	const excludedRoutes = ["/dashboard"]
	let unVerified = $state(true)

	if (browser) {
		const hackatimeVerifiedCookie = document.cookie
			.split("; ")
			.find(row => row.startsWith("hackatime_verified="))
		if (hackatimeVerifiedCookie) {
			unVerified = false
		}
	}
	console.log(isAllowed)
</script>

<svelte:head><link rel="icon" href="/Alchemist.webp" /></svelte:head>

{#if $navigating || $loaderStore}
	<div
		class="fixed inset-0 bg-black/70 flex items-center justify-center z-80 backdrop-blur-none"
	>
		<div class="flex flex-col items-center gap-4">
			<div
				class="w-12 h-12 border-2 border-primary-foreground border-t-primary rounded-full animate-spin"
			></div>
			<p class="text-primary font-mono text-xl">Loading...</p>
		</div>
	</div>
{/if}

{#if !isAllowed}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 pointer-events-none"
	>
		<div class="flex flex-col items-center gap-4">
			<div
				class="w-12 h-12 border-4 border-gray-600 border-t-red-600 rounded-full animate-spin"
			></div>
			<p class="text-white text-lg">The Dashboard is currently Locked Sorry</p>
		</div>
	</div>
{/if}

<div class="root h-screen w-screen flex items-center justify-start text-white">
	{#if !excludedRoutes.includes(page.url.pathname)}
		<Navigation />
	{/if}
	{#if unVerified}
		<div
			class="h-screen w-screen bg-black absolute flex items-center flex-col justify-center top-0 left-0 backdrop-opacity-50 z-10"
		>
			<span class="text-primary font-mono text-xl"
				>Hey! We need you to login with hackatime to access this</span
			>
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
