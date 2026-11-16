<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog/index.js"
	import { CompassIcon, Home, ShoppingBag, ShieldUser, UserStar, Package, LockKeyhole, Star } from "lucide-svelte"

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
			class="group fixed top-5 right-5 z-99 flex items-center justify-center rounded-md border-2 border-primary/80 bg-black/20 p-2 shadow-sm shadow-primary transition-all duration-200 hover:border-primary hover:bg-primary/5">
			<CompassIcon class="h-5 w-5 text-zinc-400 transition-colors group-hover:text-primary" />
		</Dialog.Trigger>

		<Dialog.Content
			class="max-w-3xl min-w-[60vw] overflow-hidden rounded-md border-2 border-primary bg-black/60 p-6 backdrop-blur-2xl sm:p-8">
			<div class="grid grid-cols-1 items-center gap-6 md:grid-cols-3 md:gap-8">
				<!-- Left -->
				<div class="flex flex-col gap-4">
					{#each navItems.filter(i => i.side === "left" && i.visible) as item}
						<Dialog.Close class="w-full">
							<a
								href={item.href}
								class="group flex items-center gap-3 rounded-md border-2 border-primary/40 bg-black/90 px-4 py-3 text-zinc-300 shadow-sm shadow-primary transition-all hover:border-primary hover:text-primary">
								<div class="rounded border border-primary/20 bg-black/50 p-1.5">
									<item.icon class="h-4 w-4" />
								</div>

								<span class="font-alchemize text-xs font-bold tracking-wider uppercase">
									{item.label}
								</span>
							</a>
						</Dialog.Close>
					{/each}
				</div>

				<!-- Center -->
				<div class="order-first flex flex-col items-center gap-4 text-center md:order-0">
					<div class="flex h-20 w-20 items-center justify-center rounded-md">
						<img src="/pmix_v2.png" alt="" class="h-16 w-16 object-contain" />
					</div>

					<div>
						<Dialog.Title class="font-alchemize text-3xl font-extrabold tracking-widest text-primary uppercase">
							Admin
						</Dialog.Title>

						<p class="mt-2 text-xs text-zinc-400">Where do you want to go today admin...</p>
					</div>

					<Dialog.Close>
						<a
							href="/dashboard"
							class="flex items-center gap-3 rounded-md border-2 border-primary/40 bg-black/90 p-2 text-zinc-300 shadow-sm shadow-primary transition-all hover:border-primary hover:text-primary">
							<Home class="h-4 w-4" />
						</a>
					</Dialog.Close>
				</div>

				<!-- Right -->
				<div class="flex flex-col gap-4">
					{#each navItems.filter(i => i.side === "right" && i.visible) as item}
						<Dialog.Close class="w-full">
							<a
								href={item.href}
								class="group flex items-center gap-3 rounded-md border-2 border-primary/40 bg-black/90 px-4 py-3 text-zinc-300 shadow-sm shadow-primary transition-all hover:border-primary hover:text-primary">
								<div class="rounded border border-primary/20 bg-black/50 p-1.5">
									<item.icon class="h-4 w-4" />
								</div>

								<span class="font-alchemize text-xs font-bold tracking-wider uppercase">
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
								class="flex items-center gap-3 rounded-md border-2 border-blue-600/40 bg-black/90 px-4 py-3 text-blue-600 shadow-sm shadow-blue-600 transition-all hover:border-blue-600">
								<div class="rounded border border-blue-600/20 bg-black/50 p-1.5">
									<LockKeyhole class="h-4 w-4" />
								</div>

								<span class="font-alchemize text-xs font-bold tracking-wider uppercase"> Supaadmin </span>
							</a>
						</Dialog.Close>
					{/if}
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Root>
</div>
```
