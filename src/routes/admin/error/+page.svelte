<script>
	import { page } from "$app/stores"
	import Button from "$lib/components/ui/button/button.svelte"

	// Only fixed messages are shown: the URL picks one by code, so a crafted link can't put arbitrary text on
	// this page
	/** @type {Record<string, { status: number, message: string }>} */
	const ERRORS = {
		missing_code: { status: 400, message: "The login response was missing its authorization code." },
		invalid_state: { status: 400, message: "This login link expired or wasn't started here. Please log in again." },
		token_exchange_failed: { status: 502, message: "Hack Club Auth didn't accept the login. Please try again." },
		invalid_identity: { status: 401, message: "Your identity token couldn't be verified." },
		no_slack: { status: 403, message: "Your Hack Club account has no linked Slack account." },
		not_admin: { status: 403, message: "This Hack Club account isn't an Alchemize admin." },
	}
	const UNKNOWN = { status: 500, message: "An unknown error occurred" }

	$: error = ERRORS[$page.url.searchParams.get("code") ?? ""] ?? UNKNOWN
	$: message = error.message
	$: status = error.status
</script>

<svelte:head>
	<title>Error</title>
	<meta name="description" content="error" />
	<meta property="og:title" content="Error" />
</svelte:head>

<div class="w-full h-screen flex flex-col items-center justify-center gap-y-4">
	<img src="/pmix_v2.png" alt="alchemize" class="h-40" />
	<h1 class="text-6xl font-bold">Error {status}</h1>
	<p class="text-2xl font-light font-mono">{message}</p>
	<a href="/admin/login">
		<Button class="bg-primary px-15 py-5 text-primary text-lg hover:scale-103">
			Are you sure????
		</Button>
	</a>
</div>
