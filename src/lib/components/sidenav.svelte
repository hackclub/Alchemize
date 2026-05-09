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
		class="top-5 right-5 z-999 absolute bg-chart-5/20 hover:bg-chart-5/40 p-2 border border-chart-5/50 rounded-full transition-colors"
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

		<div class="gap-3 grid grid-cols-2 p-6">
			{#each navItems as item}
				<Dialog.Close>
					<a href={item.href} class="group">
						<div
							class="flex gap-4 hover:bg-red-950/20 p-4 border border-red-500/20 hover:border-red-500/60 rounded-lg transition-all"
						>
							<div class="p-2">
								<item.icon class="w-6 h-6 text-chart-5" />
							</div>
							<div class="flex flex-col items-start">
								<p class="font-semibold text-foreground text-lg">
									{item.label}
								</p>
								<p class="text-muted-foreground text-xs">{item.description}</p>
							</div>
						</div>
					</a>
				</Dialog.Close>
			{/each}
		</div>
	</Dialog.Content>
</Dialog.Root>
