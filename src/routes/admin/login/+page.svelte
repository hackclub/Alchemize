<script>
	import {
		PUBLIC_ADMIN_HACKCLUB_AUTH,
		PUBLIC_ADMIN_HACKCLUB_REDIRECT,
	} from "$env/static/public"
	import Button from "$lib/components/ui/button/button.svelte"
	const clientId = PUBLIC_ADMIN_HACKCLUB_AUTH
	const uri = PUBLIC_ADMIN_HACKCLUB_REDIRECT
	let authUrl = `https://auth.hackclub.com/oauth/authorize?client_id=${clientId}&response_type=code&scope=openid+profile+email+name+verification_status+slack_id&redirect_uri=${uri}`
</script>

<div
	class="login w-screen h-screen flex items-center justify-center flex-col gap-y-4"
>
	<img src="/Alchemize.png" alt="alchemize" class="h-40" />
	<h1 class="text-5xl font-bold font-alchemize text-primary">
		Alchemize Admin
	</h1>
	<Button
		onclick={() => {
			window.location.href = authUrl
		}}
		class="bg-primary px-15 py-5 text-lg hover:scale-105"
	>
		Login with Hack Club
	</Button>
	<Button
		onclick={() => {
			window.location.href = "/dashboard"
		}}
		class="bg-transparent border-2 hover:scale-105 hover:bg-transparent px-15 py-5 text-lg"
		variant="outline"
	>
		or go back home
	</Button>
</div>
