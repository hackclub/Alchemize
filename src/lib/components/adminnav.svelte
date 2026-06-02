<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js"
	import * as Dialog from "$lib/components/ui/dialog/index.js"
	import { cn } from "$lib/lib/utils"
	import {
		CompassIcon,
		Home,
		Blocks,
		ShoppingBag,
		ArrowLeftRight,
		Users,
		ShieldUser,
		UserStar,
		Package,
		LockKeyhole,
		Star,
	} from "lucide-svelte"
	const navItems = [
		{
			href: "/dashboard/",
			label: "Home",
			icon: Home,
			description: "Main dashboard",
		},
		{
			href: "/admin/",
			label: "Admin",
			icon: ShieldUser,
			description: "Admin panel",
		},
		{
			href: "/admin/fulfillement",
			label: "Fulfillement",
			icon: Package,
			description: "Fulfillement",
		},
		{
			href: "/admin/review",
			label: "T1 Review",
			icon: Star,
			description: "Tier 1 review Dash",
		},
		{
			href: "/admin/review2",
			label: "T2 Review",
			icon: UserStar,
			description: "Tier 2 review Dash",
		},
		{
			href: "/admin/super-admin",
			label: "Supaadmin",
			icon: LockKeyhole,
			description: "Super admin commands",
		},
	]
</script>

<Dialog.Root>
	<Dialog.Trigger
		type="button"
		class="top-5 right-5 z-999 fixed bg-indigo-800/20 hover:bg-indigo-800/40 p-2 border border-indigo-800/50 rounded-full transition-colors pointer-events-auto"
	>
		<CompassIcon class="w-6 h-6 text-indigo-800" />
	</Dialog.Trigger>

	<Dialog.Content
		class="bg-background p-0 border-blue-500/40 border-dashed min-w-[60vw] overflow-hidden"
	>
		<Dialog.Header
			class="flex flex-row justify-center items-center gap-3 px-6 py-4 border-blue-500/20 border-b"
		>
			<img
				src="/Alchemize-Admin.png"
				alt=""
				class="h-14 object-contain shrink-0"
			/>
			<div>
				<Dialog.Title class="font-bold text-indigo-900 text-2xl">
					Alchemize Admin
				</Dialog.Title>
				<p class="text-muted-foreground text-xs">
					Where do you want to go today admin...
				</p>
			</div>
		</Dialog.Header>
		<div class="gap-3 grid grid-cols-3 px-6 pb-6">
			{#each navItems as item}
				<Dialog.Close>
					<a href={item.href} class="group">
						<div
							class="flex gap-1 hover:bg-blue-950/20 p-4 border border-blue-500/20 hover:border-blue-500/60 rounded-lg transition-all"
						>
							<div class="p-2">
								<item.icon class="w-6 h-6 text-indigo-900" />
							</div>
							<div class="flex flex-col items-start">
								<p class="font-semibold text-foreground text-lg">
									{item.label}
								</p>
								<p
									class={cn(
										"text-muted-foreground text-xs",
										item.label === "Supaadmin" && "text-[10px]"
									)}
								>
									{item.description}
								</p>
							</div>
						</div>
					</a>
				</Dialog.Close>
			{/each}
		</div>
	</Dialog.Content>
</Dialog.Root>
