<script lang="ts">
	import {
		Home,
		LockKeyhole,
		Package,
		Star,
		UserStar,
		ShoppingBag,
	} from "lucide-svelte"

	const { data } = $props()

	const adminButtons = [
		{
			label: "T1 Review",
			href: "/admin/review",
			icon: Star,
			show: data.isReviewer,
		},
		{
			label: "T2 Review",
			href: "/admin/review2",
			icon: UserStar,
			show: data.isT2Reviewer,
		},
		{
			label: "Fulfillment",
			href: "/admin/fulfillment",
			icon: Package,
			show: data.isFulfiller,
		},
		{
			label: "Manage Shop",
			href: "/admin/shop",
			icon: ShoppingBag,
			show: data.isShopManager,
		},
		{
			label: "Supaadmin",
			href: "/admin/super-admin",
			icon: LockKeyhole,
			show: data.isSuperAdmin,
		},
	]

	const visibleButtons = adminButtons.filter(b => b.show)

	const buttonClass =
		"bg-transparent py-4 text-lg hover:scale-103 hover:bg-admin-primary/10 hover:text-admin-text hover:border-admin-primary border-2 flex items-center justify-center gap-y-2 flex-col rounded-xl transition"
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
		class="bg-transparent p-2 text-sm hover:scale-103 hover:bg-admin-primary/10 hover:-translate-y-px border-2 hover:border-admin-primary flex items-center just-center flex-col rounded-xl transition absolute top-5 left-5 group"
	>
		<Home class="h-5 w-5 group-hover:text-admin-primary" />
	</button>
	<img src="/Alchemize-Admin.png" alt="alchemize" class="h-35" />
	<h1 class="text-5xl text-admin-primary font-alchemize font-bold">
		Alchemize Admin
	</h1>
	<h1 class="text-xl text-white font-alchemize font-medium">
		Where would you like to go today, {data.name || "Admin"}?
	</h1>
	<nav
		class="grid grid-cols-5 items-center justify-center gap-10 mt-5 w-[75%] px-10"
	>
		{#each visibleButtons as button}
			<button
				onclick={() => (window.location.href = button.href)}
				class={buttonClass}
			>
				<button.icon class="h-10 w-10" />
				{button.label}
			</button>
		{/each}
	</nav>
</div>
