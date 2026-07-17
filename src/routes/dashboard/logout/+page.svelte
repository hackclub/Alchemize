<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte"

	function rUSure() {
		const text = document.getElementById("rusure")
		const confirm = document.getElementById("button")

		if (text && confirm) {
			text.textContent = "Are you sure?"
			confirm.textContent = "Yes"

			confirm.addEventListener("click", () => {
				clearAllCookies()
			})
		}
		confirm?.removeEventListener("click", () => {
			clearAllCookies()
		})
	}

	function clearAllCookies(): void {
		const cookies: string[] = document.cookie.split(";")

		for (let i = 0; i < cookies.length; i++) {
			const cookie: string = cookies[i]
			const eqPos: number = cookie.indexOf("=")

			const name: string =
				eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim()

			if (name) {
				document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
			}
		}

		window.location.href = "/"
	}
</script>

<main
	class="bg-gradbg h-screen w-screen flex flex-col gap-y-2 items-center justify-center"
>
	<p class="text-xs font-mono text-primary" id="rusure"></p>
	<Button onclick={rUSure} id="button" class="px-5 py-2 hover:scale-103">
		Logout
	</Button>
</main>
