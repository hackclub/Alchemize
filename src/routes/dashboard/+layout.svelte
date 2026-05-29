<script lang="ts">
	import Sidenav from "$lib/components/sidenav.svelte"
	import { navigating } from "$app/stores"
	import { page } from "$app/state"
	import { browser } from "$app/environment"
	import { loaderStore } from "$lib/stores/loader"
	import {
		PUBLIC_HACKATIME_AUTH,
		PUBLIC_HACKATIME_REDIRECT,
		PUBLIC_HACKCLUB_AUTH,
		PUBLIC_HACKCLUB_REDIRECT,
	} from "$env/static/public"

	let { children, data } = $props()
	const isAllowed = $derived(data?.allowed ?? false)
	const reLogin = $derived(data?.relogin ?? false)
	const reHackatime = $derived(data?.reHackatime ?? false)
	const hackatimeAuthUrl = `https://hackatime.hackclub.com/oauth/authorize?client_id=${PUBLIC_HACKATIME_AUTH}&redirect_uri=${encodeURIComponent(PUBLIC_HACKATIME_REDIRECT)}&response_type=code&scope=profile+read`
	const authUrl = `https://auth.hackclub.com/oauth/authorize?client_id=${PUBLIC_HACKCLUB_AUTH}&response_type=code&scope=openid+profile+email&redirect_uri=${encodeURIComponent(PUBLIC_HACKCLUB_REDIRECT)}`
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
		class="fixed inset-0 bg-black/70 flex items-center justify-center z-80 backdrop-blur-none"	>
		<div class="flex flex-col items-center gap-4">
			<div
				class="w-12 h-12 border-4 border-gray-600 border-t-red-600 rounded-full animate-spin"
			></div>
			<p class="text-white text-lg">Loading...</p>
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
		<Sidenav />
	{/if}
	{#if unVerified}
		<div
			class="ovr h-screen w-screen bg-black absolute flex items-center flex-col justify-center top-0 left-0 backdrop-opacity-50 z-10"
		>
			<span>Oh!! So we actually need you to login via hackatime too</span>
			<br />
			<a
				class="button w-60 h-20 flex items-center justify-center border border-dashed border-red-600 rounded-xl"
				href={hackatimeAuthUrl}
				target="_blank">Login Via Hackatime</a
			>
		</div>
	{/if}
	{#if isAllowed}
		{@render children()}
	{/if}
</div>
<!-- <div class='bg bg-[url("/bg2.webp")] w-screen h-screen bg-cover absolute top-0 left-0 z-[-1]'></div> -->
