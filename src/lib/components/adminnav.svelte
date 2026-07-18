<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog/index.js"
	import {
		CompassIcon,
		Home,
		ShoppingBag,
		ShieldUser,
		UserStar,
		Package,
		LockKeyhole,
		Star,
	} from "lucide-svelte"

	let {
		admin,
	}: {
		admin: {
			isReviewer: boolean
			isT2Reviewer: boolean
			isShopManager: boolean
			isFulfiller: boolean
			isSuperAdmin: boolean
		} | null
	} = $props()

	const navItems = $derived.by(() => [
		{
			href: "/admin/",
			label: "Admin",
			icon: ShieldUser,
			side: "left",
			visible: true,
		},
		{
			href: "/admin/fulfillment",
			label: "Fulfillment",
			icon: Package,
			side: "right",
			visible: admin?.isFulfiller,
		},
		{
			href: "/admin/shop",
			label: "Shop",
			icon: ShoppingBag,
			side: "right",
			visible: admin?.isShopManager,
		},
		{
			href: "/admin/review",
			label: "T1 Review",
			icon: Star,
			side: "left",
			visible: admin?.isReviewer,
		},
		{
			href: "/admin/review2",
			label: "T2 Review",
			icon: UserStar,
			side: "left",
			visible: admin?.isT2Reviewer,
		},
	])
</script>

<div class="relative font-mono tracking-wide">
	<Dialog.Root>
		<Dialog.Trigger
			type="button"
			class="fixed top-5 right-5 z-99 flex items-center justify-center bg-black/20 border-2 border-admin-primary/80 hover:border-admin-primary hover:bg-admin-primary/5 p-2 rounded-md transition-all duration-200 shadow-sm shadow-admin-primary group"
		>
			<CompassIcon
				class="w-5 h-5 text-zinc-400 group-hover:text-admin-primary transition-colors"
			/>
		</Dialog.Trigger>

		<Dialog.Content
			class="bg-black/60 backdrop-blur-2xl border-2 border-admin-primary rounded-md max-w-3xl min-w-[60vw] p-6 sm:p-8 overflow-hidden"
		>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-center">
				<!-- Left -->
				<div class="flex flex-col gap-4">
					{#each navItems.filter(i => i.side === "left" && i.visible) as item}
						<Dialog.Close class="w-full">
							<a
								href={item.href}
								class="flex items-center gap-3 bg-black/90 border-2 border-admin-primary/40 px-4 py-3 rounded-md text-zinc-300 hover:text-admin-primary hover:border-admin-primary transition-all group shadow-sm shadow-admin-primary"
							>
								<div
									class="p-1.5 bg-black/50 border border-admin-primary/20 rounded"
								>
									<item.icon class="w-4 h-4" />
								</div>

								<span
									class="font-alchemize font-bold text-xs uppercase tracking-wider"
								>
									{item.label}
								</span>
							</a>
						</Dialog.Close>
					{/each}
				</div>

				<!-- Center -->
				<div
					class="flex flex-col items-center text-center gap-4 order-first md:order-0"
				>
					<div class="flex items-center justify-center w-20 h-20 rounded-md">
						<img
							src="/Alchemize-Admin.png"
							alt=""
							class="w-16 h-16 object-contain"
						/>
					</div>

					<div>
						<Dialog.Title
							class="font-alchemize font-extrabold uppercase tracking-widest text-admin-primary text-3xl"
						>
							Admin
						</Dialog.Title>

						<p class="text-zinc-400 text-xs mt-2">
							Where do you want to go today admin...
						</p>
					</div>

					<Dialog.Close>
						<a
							href="/dashboard"
							class="flex items-center gap-3 bg-black/90 border-2 border-admin-primary/40 p-2 rounded-md text-zinc-300 hover:text-admin-primary hover:border-admin-primary transition-all shadow-sm shadow-admin-primary"
						>
							<Home class="w-4 h-4" />
						</a>
					</Dialog.Close>
				</div>

				<!-- Right -->
				<div class="flex flex-col gap-4">
					{#each navItems.filter(i => i.side === "right" && i.visible) as item}
						<Dialog.Close class="w-full">
							<a
								href={item.href}
								class="flex items-center gap-3 bg-black/90 border-2 border-admin-primary/40 px-4 py-3 rounded-md text-zinc-300 hover:text-admin-primary hover:border-admin-primary transition-all group shadow-sm shadow-admin-primary"
							>
								<div
									class="p-1.5 bg-black/50 border border-admin-primary/20 rounded"
								>
									<item.icon class="w-4 h-4" />
								</div>

								<span
									class="font-alchemize font-bold text-xs uppercase tracking-wider"
								>
									{item.label}
								</span>
							</a>
						</Dialog.Close>
					{/each}

					<!-- Supaadmin -->
					{#if admin?.isSuperAdmin}
						<Dialog.Close>
							<a
								href="/admin/super-admin"
								class="flex items-center gap-3 bg-black/90 border-2 border-blue-600/40 hover:border-blue-600 px-4 py-3 rounded-md text-blue-600 transition-all shadow-sm shadow-blue-600"
							>
								<div
									class="p-1.5 bg-black/50 border border-blue-600/20 rounded"
								>
									<LockKeyhole class="w-4 h-4" />
								</div>

								<span
									class="font-alchemize font-bold text-xs uppercase tracking-wider"
								>
									Supaadmin
								</span>
							</a>
						</Dialog.Close>
					{/if}
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Root>
</div>
```
