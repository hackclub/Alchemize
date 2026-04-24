<script lang="ts">
	import Sidenav from "$lib/components/sidenav.svelte"
	let { children } = $props()
	import { PUBLIC_HACKATIME_AUTH,PUBLIC_HACKATIME_REDIRECT } from "$env/static/public"
    console.log("Hackatime Auth:", PUBLIC_HACKATIME_AUTH);
	let unVerified = true
	if (typeof document !== "undefined") {
		const hackatimeVerifiedCookie = document.cookie
			.split("; ")
			.find(row => row.startsWith("hackatime_verified="))
		if (hackatimeVerifiedCookie) {
			unVerified = false
		}
	}
</script>

<svelte:head><link rel="icon" href="/Alchemist.webp" /></svelte:head>
<div class="root h-screen w-screen flex items-center justify-start text-white">
	<Sidenav />
	{#if unVerified}
	<div
		class="ovr h-screen w-screen bg-black absolute flex items-center flex-col justify-center top-0 left-0 backdrop-opacity-50 z-10"
	>
		<span>Oh!! So we actually need you to login via hackatime too</span> <br />
		<a
			class="button w-60 h-20 flex items-center justify-center border border-dashed border-red-600 rounded-xl"
			href="https://hackatime.hackclub.com/oauth/authorize?client_id={PUBLIC_HACKATIME_AUTH}&redirect_uri={encodeURIComponent(PUBLIC_HACKATIME_REDIRECT)}&response_type=code&scope=profile+read"
			target="_blank">Login Via Hackatime</a
		>
	</div>
	{/if}
	{@render children()}
</div>
<!-- <div class='bg bg-[url("/bg2.webp")] w-screen h-screen bg-cover absolute top-0 left-0 z-[-1]'></div> -->
