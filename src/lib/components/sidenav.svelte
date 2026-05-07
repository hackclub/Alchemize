<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js"
	import * as Dialog from "$lib/components/ui/dialog/index.js"
	import {
		CompassIcon,
		Home,
		Blocks,
		ShoppingBag,
		ArrowLeftRight,
	} from "lucide-svelte"

	const navItems = [
		{
			href: "/dashboard",
			label: "Home",
			icon: Home,
			description: "Your dashboard overview",
		},
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
		{
			href: "/dashboard/exchange",
			label: "Exchange",
			icon: ArrowLeftRight,
			description: "Trade and exchange",
		},
	]
</script>

<Dialog.Root>
	<Dialog.Trigger
		type="button"
		class="absolute top-5 right-5 bg-chart-5/20 hover:bg-chart-5/40 border border-chart-5/50 p-2 rounded-full transition-colors"
	>
		<CompassIcon class="h-6 w-6 text-chart-5" />
	</Dialog.Trigger>

	<Dialog.Content
		class="min-w-[60vw] bg-background border-red-500/40 border-dashed p-0 overflow-hidden"
	>
		<Dialog.Header
			class="flex flex-row items-center justify-center gap-3 px-6 py-4 border-b border-red-500/20"
		>
			<img
				src="/Alchemist.webp"
				alt=""
				class="h-10 w-10 shrink-0 object-contain"
			/>
			<div>
				<Dialog.Title class="text-2xl font-bold text-chart-5">
					Alchemize
				</Dialog.Title>
				<p class="text-xs text-muted-foreground">
					Where do you want to go today...
				</p>
			</div>
		</Dialog.Header>

		<div class="grid grid-cols-2 gap-3 p-6">
			{#each navItems as item}
				<Dialog.Close>
					<a href={item.href} class="group">
						<div
							class="flex gap-4 p-4 rounded-lg border border-red-500/20 hover:border-red-500/60 hover:bg-red-950/20 transition-all"
						>
							<div class="p-2">
								<item.icon class="h-6 w-6 text-chart-5" />
							</div>
							<div class="flex flex-col items-start">
								<p class="font-semibold text-foreground text-lg">
									{item.label}
								</p>
								<p class="text-xs text-muted-foreground">{item.description}</p>
							</div>
						</div>
					</a>
				</Dialog.Close>
			{/each}
		</div>
	</Dialog.Content>
</Dialog.Root>
