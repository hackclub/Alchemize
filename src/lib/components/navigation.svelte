<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog/index.js"
	import { cn } from "$lib/lib/utils"
	import { page } from "$app/state"
	import {
		CompassIcon,
		Home,
		Blocks,
		ShoppingBag,
		ArrowLeftRight,
		Users,
		ShieldUser,
	} from "lucide-svelte"

	const isAdmin = $derived(!page.data?.admin)

	const navItems = [
		{
			href: "/dashboard/projects",
			label: "Projects",
			icon: Blocks,
			description: "Manage your projects",
		},
		{
			href: "/dashboard/shop",
			label: "Shop",
			icon: ShoppingBag,
			description: "Browse the shop",
		},
	]
	const topNavItems = [
		{
			href: "/dashboard/",
			label: "Dashboard",
			icon: Home,
			description: "Your dashboard",
		},
		{
			href: "/refer",
			label: "Refer",
			icon: Users,
			description: "Refer people for rewards",
		},
		{
			href: "/dashboard/trade",
			label: "Trade",
			icon: ArrowLeftRight,
			description: "Trade and exchange",
		},
	]
</script>

<div class="relative">
	<Dialog.Root>
		<Dialog.Trigger
			type="button"
			class="fixed top-5 right-5 z-[9999] bg-chart-5/20 hover:bg-chart-5/40 p-2 border border-chart-5/50 rounded-full transition-colors"
		>
			<CompassIcon class="w-6 h-6 text-chart-5" />
		</Dialog.Trigger>

		<Dialog.Content
			class="bg-background p-0 border-red-500/40 border-dashed min-w-[60vw] overflow-hidden"
		>
			<Dialog.Header
				class="flex flex-row justify-center items-center gap-3 px-6 py-4 border-red-500/20 border-b"
			>
				<img
					src="/Alchemize.png"
					alt=""
					class="w-10 h-10 object-contain shrink-0"
				/>
				<div>
					<Dialog.Title class="font-bold text-chart-5 text-2xl">
						Alchemize
					</Dialog.Title>
					<p class="text-muted-foreground text-xs">
						Where do you want to go today...
					</p>
				</div>
			</Dialog.Header>
			<div class="gap-x-3 grid grid-cols-3 px-6">
				{#each topNavItems as item}
					<Dialog.Close>
						<div class="relative group">
							<div
								class="absolute inset-0 bg-primary/80 translate-x-[3px] translate-y-[3px] rounded-lg transition-transform -z-10"
							></div>
							<a href={item.href} class="group">
								<div
									class="relative flex gap-1 bg-zinc-950 p-4 border border-primary rounded-lg transition-all items-center w-full z-10 group-hover:translate-x-[2px] group-hover:translate-y-[2px]"
								>
									<div class="p-2">
										<item.icon class="w-6 h-6 text-chart-5" />
									</div>
									<div class="flex flex-col items-start w-full">
										<p class="font-semibold text-foreground text-lg">
											{item.label}
										</p>
										<p
											class={cn(
												"text-muted-foreground text-xs text-left",
												item.label === "Refer" && "text-[11px]"
											)}
										>
											{item.description}
										</p>
									</div>
								</div>
							</a>
						</div>
					</Dialog.Close>
				{/each}
			</div>
			<div
				class={cn("gap-3 grid grid-cols-2 px-6 pb-6", isAdmin && "grid-cols-3")}
			>
				{#each navItems as item}
					<Dialog.Close>
						<div class="relative group">
							<div
								class="absolute inset-0 bg-primary/80 translate-x-[3px] translate-y-[3px] rounded-lg transition-transform -z-10"
							></div>
							<a href={item.href} class="group">
								<div
									class="relative flex gap-1 bg-zinc-950 p-4 border border-primary rounded-lg transition-all items-center w-full z-10 group-hover:translate-x-[2px] group-hover:translate-y-[2px]"
								>
									<div class="p-2">
										<item.icon class="w-6 h-6 text-chart-5" />
									</div>
									<div class="flex flex-col items-start">
										<p class="font-semibold text-foreground text-lg">
											{item.label}
										</p>
										<p class="text-muted-foreground text-xs">
											{item.description}
										</p>
									</div>
								</div>
							</a>
						</div>
					</Dialog.Close>
				{/each}
				{#if isAdmin}
					<Dialog.Close>
						<div class="relative group">
							<div
								class="absolute inset-0 bg-admin-primary translate-x-[3px] translate-y-[3px] rounded-lg transition-transform -z-10"
							></div>
							<a href={"/admin"} class="group">
								<div
									class="relative flex gap-1 bg-zinc-950 p-4 border border-admin-primary rounded-lg transition-all items-center w-full z-10 group-hover:translate-x-[2px] group-hover:translate-y-[2px]"
								>
									<div class="p-2">
										<ShieldUser class="w-6 h-6 text-admin-primary" />
									</div>
									<div class="flex flex-col items-start">
										<p class="font-semibold text-foreground text-lg">Admin</p>
										<p class="text-muted-foreground text-xs">
											Alchemize backend...
										</p>
									</div>
								</div>
							</a>
						</div>
					</Dialog.Close>
				{/if}
			</div>
		</Dialog.Content>
	</Dialog.Root>
</div>
