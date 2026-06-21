<script>
	import { page } from "$app/stores"
	import Button from "$lib/components/ui/button/button.svelte"

	$: message =
		$page.url.searchParams.get("message") || "An unknown error occurred"
	$: status = $page.url.searchParams.get("status") || "500"
</script>

<svelte:head>
	<title>Error</title>
	<meta name="description" content="error" />
	<meta property="og:title" content="Error" />
</svelte:head>

<div class="w-full h-screen flex flex-col items-center justify-center gap-y-4">
	<img src="/Alchemize-Admin.png" alt="alchemize" class="h-40" />
	<h1 class="text-6xl font-bold">Error {status}</h1>
	<p class="text-2xl font-light font-mono">{message}</p>
	<a href="/admin/login">
		<Button
			class="bg-admin-primary px-15 py-5 text-admin-text text-lg hover:scale-103"
		>
			Are you sure????
		</Button>
	</a>
</div>
