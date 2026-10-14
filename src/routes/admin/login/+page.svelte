<script>
	import Button from "$lib/components/ui/button/button.svelte"
	// Server route that sets the OAuth state cookie and redirects to Hack Club Auth
	const authUrl = "/admin/auth"
</script>

<svelte:head>
	<title>Admin Login</title>
	<meta name="description" content="Alchemize admin" />
	<meta property="og:title" content="Admin Login" />
</svelte:head>

<div
	class="login w-screen h-screen flex items-center justify-center flex-col gap-y-4"
>
	<img src="/pmix_v2.png" alt="alchemize" class="h-40" />
	<h1 class="text-5xl font-bold font-decor uppercase select-none text-primary">
		Alchemize Admin
	</h1>
	<div class="flex gap-x-5 items-center">
		<Button
			onclick={() => {
				window.location.href = authUrl
			}}
			size="xl"
			variant="primary"
		>
			Login with Hack Club
		</Button>
		<Button
			onclick={() => {
				window.location.href = "/dashboard"
			}}
			variant="outline"
			size="xl"
		>
			or go back home
		</Button>
	</div>
</div>
