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

<div class="login flex h-screen w-screen flex-col items-center justify-center gap-y-4">
	<img src="/pmix_v2.png" alt="alchemize" class="h-40" />
	<h1 class="font-decor text-5xl font-bold text-primary uppercase select-none">Alchemize Admin</h1>
	<div class="flex items-center gap-x-5">
		<Button
			onclick={() => {
				window.location.href = authUrl
			}}
			size="xl"
			variant="primary">
			Login with Hack Club
		</Button>
		<Button
			onclick={() => {
				window.location.href = "/dashboard"
			}}
			variant="outline"
			size="xl">
			or go back home
		</Button>
	</div>
</div>
