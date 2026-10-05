<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog/index.js"
	import { page } from "$app/state"
	import {
		CompassIcon,
		Home,
		Blocks,
		ShoppingBag,
		Users,
		Newspaper,
		ShieldUser,
		Moon,
		Sun,
	} from "lucide-svelte"
	import { mode, toggleMode } from "mode-watcher"

	const isAdmin = $derived(!page.data?.admin)

	const centerItems = [
		{
			href: "/dashboard",
			icon: Home,
			label: "Dashboard",
		},
		// {
		// 	href: "/docs",
		// 	icon: Newspaper,
		// 	label: "Documentation",
		// },
	]

	const navItems = [
		// {
		// 	href: "/dashboard/explore",
		// 	label: "Explore",
		// 	icon: Compass,
		// 	side: "left",
		// },
		{ href: "/docs", label: "Documentation", icon: Newspaper, side: "left" },
		{ href: "/refer", label: "Refer", icon: Users, side: "left" },
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

	const isDark = $derived(mode.current === "dark")
</script>

<div class="relative font-mono tracking-wide">
	<Dialog.Root>
		<Dialog.Trigger
			type="button"
			class="fixed left-1/2 top-3 z-50 flex -translate-x-1/2 items-center justify-center border-2 border-primary/80 bg-secondary/90 py-1 px-5 rounded-md text-secondary-foreground shadow-sm shadow-primary transition-all duration-200 hover:border-primary hover:bg-border/5 group gap-3"
		>
			<CompassIcon
				class="w-6 h-6 text-secondary-foreground group-hover:text-primary transition-colors"
			/>
			Go Somewhere?
		</Dialog.Trigger>

		<Dialog.Content
			class="bg-secondary/80 backdrop-blur-md border-2 border-primary shadow-lg shadow-primary rounded rounded-tl-3xl rounded-br-3xl max-w-[60%] min-w-[60vw] p-6 sm:p-8 overflow-hidden z-9999 [&>button]:hidden"
		>
			<div
				class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-center w-full"
			>
				<div class="flex flex-col gap-4 justify-center">
					{#each navItems.filter(i => i.side === "left") as item}
						<Dialog.Close class="w-full text-left">
							<a
								href={item.href}
								class="flex items-center gap-3 rounded-md border-2 border-primary/40 bg-card px-4 py-3 text-foreground shadow-sm shadow-primary transition-all duration-150 hover:border-primary hover:bg-card/70 hover:text-primary group"
							>
								<div
									class="rounded border border-primary/50 bg-secondary p-1.5 text-secondary-foreground transition-colors group-hover:border-primary group-hover:text-primary"
								>
									<item.icon class="w-4 h-4 stroke-2" />
								</div>

								<span
									class="font-note font-bold text-xs uppercase tracking-wider"
								>
									{item.label}
								</span>
							</a>
						</Dialog.Close>
					{/each}
				</div>

				<div
					class="flex flex-col justify-center items-center gap-3 border-b-2 border-primary/20 px-2 py-4 text-center order-first md:order-0 md:border-b-0 md:py-0"
				>
					<div
						class="relative flex items-center justify-center w-20 h-20 rounded-md p-2"
					>
						<img
							src="/pmix_v2.png"
							alt="Alchemize Logo"
							class="w-20 h-20 object-contain"
						/>
					</div>

					<div>
						<Dialog.Title
							class="font-decor font-extrabold uppercase tracking-tight text-secondary-foreground text-2xl sm:text-3xl leading-none"
						>
							Alchemize
						</Dialog.Title>

						<p
							class="text-muted-foreground text-xs mt-2 max-w-[200px] mx-auto font-body tracking-normal leading-relaxed"
						>
							Where do you want to go today?
						</p>
					</div>

					<div class="flex items-center justify-evenly w-full">
						{#each centerItems as item}
							<Dialog.Close class="text-left" title={item.label}>
								<a
									href={item.href}
									class="flex items-center gap-3 rounded-md border-2 border-primary/40 bg-card p-2 text-foreground shadow-sm shadow-primary transition-all duration-150 hover:border-primary hover:text-primary group"
								>
									<item.icon class="w-4 h-4 stroke-2" />
								</a>
							</Dialog.Close>
						{/each}
						<button
							type="button"
							class="flex items-center justify-center gap-2 self-center rounded-md border-2 border-primary/40 bg-card p-2 text-foreground shadow-sm shadow-primary transition-all duration-150 hover:border-primary hover:text-primary"
							onclick={toggleMode}
							aria-label={isDark
								? "Switch to light mode"
								: "Switch to dark mode"}
							title={isDark ? "Switch to light mode" : "Switch to dark mode"}
						>
							{#if isDark}
								<Sun class="h-4 w-4" />
							{:else}
								<Moon class="h-4 w-4" />
							{/if}
						</button>
					</div>
				</div>

				<div class="flex flex-col gap-4 justify-center">
					{#each navItems.filter(i => i.side === "right") as item}
						<Dialog.Close class="w-full text-left">
							<a
								href={item.href}
								class="flex items-center gap-3 rounded-md border-2 border-primary/40 bg-card px-4 py-3 text-foreground shadow-sm shadow-primary transition-all duration-150 hover:border-primary hover:bg-card/70 hover:text-primary group"
							>
								<div
									class="rounded border border-primary/20 bg-secondary p-1.5 text-secondary-foreground transition-colors group-hover:border-primary/50 group-hover:text-primary"
								>
									<item.icon class="w-4 h-4 stroke-2" />
								</div>

								<span
									class="font-note font-bold text-xs uppercase tracking-wider"
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
								class="flex items-center gap-3 rounded-md border-2 border-primary/60 bg-card px-4 py-3 text-primary shadow-sm shadow-primary transition-all duration-150 hover:border-primary-hover group"
							>
								<div
									class="rounded border border-primary/20 bg-secondary p-1.5 text-primary/80 transition-colors group-hover:border-primary/50 group-hover:text-primary"
								>
									<ShieldUser class="w-4 h-4 stroke-2" />
								</div>

								<span
									class="font-note font-bold text-xs uppercase tracking-wider"
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
