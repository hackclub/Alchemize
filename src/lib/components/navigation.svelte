<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog/index.js"
	import { page } from "$app/state"
	import {
		CompassIcon,
		Home,
		Blocks,
		ShoppingBag,
		ArrowLeftRight,
		Users,
		Newspaper,
		ShieldUser,
	} from "lucide-svelte"

	const isAdmin = $derived(!page.data?.admin)

	const navItems = [
		{ href: "/docs", label: "Documentation", icon: Newspaper, side: "left" },
		{ href: "/refer", label: "Refer", icon: Users, side: "left" },
		{
			href: "/dashboard/trade",
			label: "Trade",
			icon: ArrowLeftRight,
			side: "left",
		},
		{
			href: "/dashboard/projects",
			label: "Projects",
			icon: Blocks,
			side: "right",
		},
		{
			href: "/dashboard/shop",
			label: "Shop",
			icon: ShoppingBag,
			side: "right",
		},
	]
</script>

<div class="relative font-mono tracking-wide">
	<Dialog.Root>
		<Dialog.Trigger
			type="button"
			class="fixed top-5 right-5 z-99 flex items-center justify-center bg-black/20 border-2 border-primary/80 hover:border-primary hover:bg-primary/5 p-2 rounded-md transition-all duration-200 shadow-[2px_2px_0px_0px_rgba(var(--primary),0.3)] active:translate-x-0.5 active:translate-y-0.5 group"
		>
			<CompassIcon
				class="w-5 h-5 text-zinc-400 group-hover:text-primary transition-colors"
			/>
		</Dialog.Trigger>

		<Dialog.Content
			class="bg-black/60 backdrop-blur-2xl border-2 border-primary rounded-md max-w-3xl min-w-[60vw] p-6 sm:p-8  overflow-hidden z-9999"
		>
			<div
				class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-center w-full"
			>
				<div class="flex flex-col gap-4 justify-center">
					{#each navItems.filter(i => i.side === "left") as item}
						<Dialog.Close class="w-full text-left">
							<a
								href={item.href}
								class="flex items-center gap-3 bg-black/90 border-2 border-primary/40 px-4 py-3 rounded-md text-zinc-300 hover:text-primary hover:border-primary hover:bg-black/20 transition-all duration-150 group shadow-[2px_2px_0px_0px_rgba(var(--primary),0.1)]"
							>
								<div
									class="p-1.5 bg-black/50 border border-primary/20 rounded text-zinc-400 group-hover:text-primary group-hover:border-primary/50 transition-colors"
								>
									<item.icon class="w-4 h-4 stroke-2" />
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

				<div
					class="flex flex-col justify-center items-center gap-3 px-2 text-center order-first md:order-none py-4 md:py-0 border-b-2 border-primary/20 md:border-b-0"
				>
					<div
						class="relative flex items-center justify-center w-20 h-20 bg-black/40 rounded-md p-2 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(var(--primary),0.3)]"
					>
						<img
							src="/Alchemize.png"
							alt="Alchemize Logo"
							class="w-16 h-16 object-contain"
						/>
					</div>
					<div>
						<Dialog.Title
							class="font-alchemize font-black uppercase tracking-widest text-primary text-2xl sm:text-3xl leading-none"
						>
							Alchemize
						</Dialog.Title>
						<p
							class="text-zinc-400 text-xs mt-2 max-w-[200px] mx-auto font-sans tracking-normal leading-relaxed"
						>
							Where do you want to go today?
						</p>
					</div>
					<Dialog.Close class="text-left">
						<a
							href={"/dashboard"}
							class="flex items-center gap-3 bg-black/90 border-2 border-primary/40 p-2 rounded-md text-zinc-300 hover:text-primary hover:border-primary transition-all duration-150 group shadow-[2px_2px_0px_0px_rgba(var(--primary),0.1)]"
						>
							<Home class="w-4 h-4 stroke-2" />
						</a>
					</Dialog.Close>
				</div>

				<div class="flex flex-col gap-4 justify-center">
					{#each navItems.filter(i => i.side === "right") as item}
						<Dialog.Close class="w-full text-left">
							<a
								href={item.href}
								class="flex items-center gap-3 bg-black/90 border-2 border-primary/40 px-4 py-3 rounded-md text-zinc-300 hover:text-primary hover:border-primary hover:bg-black/20 transition-all duration-150 group shadow-[2px_2px_0px_0px_rgba(var(--primary),0.1)]"
							>
								<div
									class="p-1.5 bg-black/50 border border-primary/20 rounded text-zinc-400 group-hover:text-primary group-hover:border-primary/50 transition-colors"
								>
									<item.icon class="w-4 h-4 stroke-2" />
								</div>
								<span
									class="font-alchemize font-bold text-xs uppercase tracking-wider"
								>
									{item.label}
								</span>
							</a>
						</Dialog.Close>
					{/each}

					{#if isAdmin}
						<Dialog.Close class="w-full text-left">
							<a
								href="/admin"
								class="flex items-center gap-3 bg-black/90 border-2 border-red-500/40 hover:border-red-500 px-4 py-3 rounded-md text-red-400 hover:bg-red-500/5 transition-all duration-150 group shadow-[2px_2px_0px_0px_rgba(239,68,68,0.1)]"
							>
								<div
									class="p-1.5 bg-black/50 border border-red-500/20 rounded text-red-400/70 group-hover:text-red-400 group-hover:border-red-500/50 transition-colors"
								>
									<ShieldUser class="w-4 h-4 stroke-2" />
								</div>
								<span
									class="font-alchemize font-bold text-xs uppercase tracking-wider"
								>
									Admin Dash
								</span>
							</a>
						</Dialog.Close>
					{/if}
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Root>
</div>
