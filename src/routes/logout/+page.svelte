<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte"

	let confirming = false

	async function logout() {
		await fetch("/logout", {
			method: "POST",
		})

		window.location.href = "/"
	}

	function handleClick() {
		if (!confirming) {
			confirming = true
			return
		}

		logout()
	}
</script>

<main class="bg-gradbg flex h-screen w-screen flex-col items-center justify-center gap-y-2">
	{#if confirming}
		<p class="font-mono text-xs text-primary">Are you sure?</p>
	{/if}

	<Button onclick={handleClick} class="px-5 py-2 hover:scale-103">
		{confirming ? "Yes, i am" : "Logout"}
	</Button>
</main>
