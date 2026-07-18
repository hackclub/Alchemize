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

<main
	class="bg-gradbg h-screen w-screen flex flex-col gap-y-2 items-center justify-center"
>
	{#if confirming}
		<p class="text-xs font-mono text-primary">Are you sure?</p>
	{/if}

	<Button onclick={handleClick} class="px-5 py-2 hover:scale-103">
		{confirming ? "Yes, i am" : "Logout"}
	</Button>
</main>
