<script>
	import { onMount } from "svelte"
	const { data } = $props()
	onMount(() => {
		if (!data.isAdmin) {
			window.location.href = "/admin/login"
		}
	})
</script>

<div
	class="admin-cont flex h-screen w-screen items-center justify-center flex-col"
>
	<h1 class="text-2xl">
		Where would you like to go today? {data.name || "Admin"}.
	</h1>
	<nav class="flex gap-10 mt-5">
		<a
			href="/admin/review"
			class="bg-white text-black w-30 flex items-center justify-center p-2 rounded-full"
			>Review</a
		>
		<a
			href="/admin/fulfillment"
			class="bg-white text-black w-30 flex items-center justify-center p-2 rounded-full"
			>Fulfillment</a
		>
		<a
			href="/admin/super-admin"
			class="bg-white text-black w-30 flex items-center justify-center p-2 rounded-full"
			>Super Admin</a
		>
	</nav>
</div>
