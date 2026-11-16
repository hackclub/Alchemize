<script lang="ts">
	import { Home, LockKeyhole, Package, Star, UserStar, ShoppingBag } from "lucide-svelte"

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
		"bg-transparent py-4 text-lg text-[var(--primary-foreground)] hover:scale-103 hover:bg-[color:var(--primary)]/10 hover:text-[var(--primary-foreground)] hover:border-[color:var(--primary)] border-2 border-[color:var(--primary)] flex items-center justify-center gap-y-2 flex-col rounded-xl transition"
</script>

<svelte:head>
	<title>Alchemize | Admin</title>
	<meta name="description" content="Alchemize Admin" />
	<meta property="og:title" content="Alchemize | Admin" />
</svelte:head>

<div class="admin-cont flex h-screen w-screen flex-col items-center justify-center gap-y-2">
	<button
		onclick={() => {
			window.location.href = "/dashboard"
		}}
		class="just-center group absolute top-5 left-5 flex flex-col items-center rounded-xl border-2 border-[color:var(--primary)] bg-transparent p-2 text-sm text-[var(--primary-foreground)] transition hover:-translate-y-px hover:scale-103 hover:border-[color:var(--primary)] hover:bg-[color:var(--primary)]/10">
		<Home class="h-5 w-5 group-hover:text-[var(--primary-foreground)]" />
	</button>
	<img src="/pmix_v2.png" alt="alchemize" class="h-35" />
	<h1 class="font-alchemize text-5xl font-bold text-[var(--primary)]">Alchemize Admin</h1>
	<h1 class="font-alchemize text-xl font-medium text-[var(--primary-foreground)]">
		Where would you like to go today, {data.name || "Admin"}?
	</h1>
	<nav class="mt-5 grid w-[75%] grid-cols-5 items-center justify-center gap-10 px-10">
		{#each visibleButtons as button (button.href)}
			<button onclick={() => (window.location.href = button.href)} class={buttonClass}>
				<button.icon class="h-10 w-10" />
				{button.label}
			</button>
		{/each}
	</nav>
</div>
