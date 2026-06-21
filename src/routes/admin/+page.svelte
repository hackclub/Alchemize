<script>
	import Button from "$lib/components/ui/button/button.svelte"
	import { ShoppingBag } from "@lucide/svelte"
	import { Home, LockKeyhole, Package, Star, UserStar } from "lucide-svelte"
	import { onMount } from "svelte"
	const { data } = $props()
	onMount(() => {
		if (!data.isAdmin) {
			window.location.href = "/admin/login"
		}
	})
</script>

<svelte:head>
	<title>Alchemize | Admin</title>
	<meta name="description" content="Alchemize Admin" />
	<meta property="og:title" content="Alchemize | Admin" />
</svelte:head>

<div
	class="admin-cont flex h-screen w-screen items-center justify-center flex-col gap-y-2"
>
	<button
		onclick={() => {
			window.location.href = "/dashboard"
		}}
		class="bg-transparent p-3 text-sm hover:scale-103 hover:bg-admin-primary/10 hover:-translate-y-px border-2 hover:border-admin-primary flex items-center just-center flex-col rounded-xl transition absolute top-5 left-5"
	>
		<Home class="h-5 w-5" />
		Home
	</button>
	<img src="/Alchemize-Admin.png" alt="alchemize" class="h-35" />
	<h1 class="text-5xl text-admin-primary font-alchemize font-bold">
		Alchemize Admin
	</h1>
	<h1 class="text-xl text-white font-alchemize font-medium">
		Where would you like to go today, {data.name || "Admin"}?
	</h1>
	<nav class="grid grid-cols-5 grid-rows-2 gap-10 mt-5 w-full px-10">
		{#if data.isReviewer}
			<button
				onclick={() => {
					window.location.href = "/admin/review"
				}}
				class="bg-transparent py-4 text-lg hover:scale-103 hover:bg-admin-primary/10 hover:text-admin-text hover:border-admin-primary border-2 flex items-center just-center gap-y-2 flex-col rounded-xl transition"
			>
				<Star class="h-10 w-10" />
				T1 Review
			</button>
		{/if}
		{#if data.isT2Reviewer}
			<button
				onclick={() => {
					window.location.href = "/admin/review2"
				}}
				class="bg-transparent py-4 text-lg hover:scale-103 hover:bg-admin-primary/10 hover:text-admin-text hover:border-admin-primary border-2 flex items-center just-center gap-y-2 flex-col rounded-xl transition"
			>
				<UserStar class="h-10 w-10" />
				T2 Review
			</button>
		{/if}
		{#if data.isFulfiller}
			<button
				onclick={() => {
					window.location.href = "/admin/fulfillment"
				}}
				class="bg-transparent py-4 text-lg hover:scale-103 hover:bg-admin-primary/10 hover:text-admin-text hover:border-admin-primary border-2 flex items-center just-center gap-y-2 flex-col rounded-xl transition"
			>
				<Package class="h-10 w-10" />
				Fulfillment
			</button>
		{/if}
		{#if data.isShopManager}
			<button
				onclick={() => {
					window.location.href = "/admin/shop"
				}}
				class="bg-transparent py-4 text-lg hover:scale-103 hover:bg-admin-primary/10 hover:text-admin-text hover:border-admin-primary border-2 flex items-center just-center gap-y-2 flex-col rounded-xl transition"
			>
				<ShoppingBag class="h-10 w-10" />
				Manage Shop
			</button>
		{/if}
		{#if data.isSuperAdmin}
			<button
				onclick={() => {
					window.location.href = "/admin/super-admin"
				}}
				class="bg-transparent py-4 text-lg hover:scale-103 hover:bg-admin-primary/10 hover:text-admin-text hover:border-admin-primary border-2 flex items-center just-center gap-y-2 flex-col rounded-xl transition"
			>
				<LockKeyhole class="h-10 w-10" />
				Supaadmin
			</button>
		{/if}
	</nav>
</div>
