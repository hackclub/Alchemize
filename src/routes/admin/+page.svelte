<script>
	import Button from "$lib/components/ui/button/button.svelte"
	import { Home, LockKeyhole, Package, UserStar } from "lucide-svelte"
	import { onMount } from "svelte"
	const { data } = $props()
	onMount(() => {
		if (!data.isAdmin) {
			window.location.href = "/admin/login"
		}
	})
</script>

<div
	class="admin-cont flex h-screen w-screen items-center justify-center flex-col gap-y-2"
>
	<img src="/Alchemize-Admin.png" alt="alchemize" class="h-35" />
	<h1 class="text-5xl text-admin-text font-alchemize font-bold">
		Alchemize Admin
	</h1>
	<h1 class="text-xl text-white font-alchemize font-medium">
		Where would you like to go today, {data.name || "Admin"}?
	</h1>
	<nav class="grid grid-cols-4 grid-rows-2 gap-10 mt-5">
		<button
			onclick={() => {
				window.location.href = "/admin/review"
			}}
			class="bg-transparent px-15 py-5 text-lg hover:scale-105 border-4 hover:bg-transparent hover:text-admin-text flex items-center just-center gap-y-2 flex-col rounded-xl transition"
		>
			<UserStar class="h-10 w-10" />
			Review dash
		</button>
		<button
			onclick={() => {
				window.location.href = "/admin/fulfillement"
			}}
			class="bg-transparent px-15 py-5 text-lg hover:scale-105 border-4 hover:bg-transparent hover:text-admin-text flex items-center just-center gap-y-2 flex-col rounded-xl transition"
		>
			<Package class="h-10 w-10" />
			Fulfillement
		</button>
		<button
			onclick={() => {
				window.location.href = "/admin/super-admin"
			}}
			class="bg-transparent px-15 py-5 text-lg hover:scale-105 border-4 hover:bg-transparent hover:text-admin-text flex items-center just-center gap-y-2 flex-col rounded-xl transition"
		>
			<LockKeyhole class="h-10 w-10" />
			Supaadmin
		</button>
		<button
			onclick={() => {
				window.location.href = "/dashboard"
			}}
			class="bg-transparent px-15 py-5 text-lg hover:scale-105 border-4 hover:bg-transparent hover:text-admin-text flex items-center just-center gap-y-2 flex-col rounded-xl transition"
		>
			<Home class="h-10 w-10" />
			Home
		</button>
	</nav>
</div>
