<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog/index.js"
	import { page } from "$app/state"
	import { buttonVariants } from "$lib/components/ui/button/button.svelte"
	import { CompassIcon, Home, Blocks, ShoppingBag, Users, Newspaper, ShieldUser, Moon, Sun } from "lucide-svelte"

	let { inline = false }: { inline?: boolean } = $props()

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
		{ href: "/docs", label: "Docs", icon: Newspaper, side: "left" },
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
</script>

<div class="relative font-mono tracking-wide">
	<Dialog.Root>
		<Dialog.Trigger
			type="button"
			class={inline
				? `${buttonVariants({ variant: "outline", size: "sm" })} group`
				: "group fixed top-3 left-1/2 z-50 flex -translate-x-1/2 items-center justify-center gap-3 rounded-md border-2 border-primary/80 bg-secondary/90 px-5 py-1 text-secondary-foreground shadow-sm shadow-primary transition-all duration-200 hover:border-primary hover:bg-border/5"}>
			<CompassIcon class="size-4 text-secondary-foreground transition-colors group-hover:text-primary" />
			{inline ? "Navigate" : "Go Somewhere?"}
		</Dialog.Trigger>

		<Dialog.Content
			class="z-9999 max-w-[60%] min-w-[60vw] overflow-hidden rounded rounded-tl-3xl rounded-br-3xl border-2 border-primary bg-secondary/40 p-6 shadow-sm shadow-primary backdrop-blur-md sm:p-8 [&>button]:hidden">
			<div class="grid w-full grid-cols-1 items-center gap-6 md:grid-cols-3 md:gap-8">
				<div class="flex flex-col justify-center gap-4">
					{#each navItems.filter(i => i.side === "left") as item}
						<Dialog.Close class="w-full text-left">
							<a
								href={item.href}
								class="group flex items-center gap-3 rounded-md border-2 border-primary/40 bg-card px-4 py-3 text-foreground shadow-sm shadow-primary transition-all duration-150 hover:border-primary hover:bg-card/70 hover:text-primary">
								<div
									class="rounded border border-primary/50 bg-secondary p-1.5 text-secondary-foreground transition-colors group-hover:border-primary group-hover:text-primary">
									<item.icon class="h-4 w-4 stroke-2" />
								</div>

								<span class="font-note text-xs font-bold tracking-wider uppercase">
									{item.label}
								</span>
							</a>
						</Dialog.Close>
					{/each}
				</div>

				<div
					class="order-first flex flex-col items-center justify-center gap-3 border-b-2 border-primary/20 px-2 py-4 text-center md:order-0 md:border-b-0 md:py-0">
					<div class="relative flex h-20 w-20 items-center justify-center rounded-md p-2">
						<img src="/pmix_v2.png" alt="Alchemize Logo" class="h-20 w-20 object-contain" />
					</div>

					<div>
						<Dialog.Title
							class="font-decor text-2xl leading-none font-extrabold tracking-tight text-secondary-foreground uppercase sm:text-3xl">
							Alchemize
						</Dialog.Title>

						<p
							class="mx-auto mt-2 max-w-[200px] font-body text-xs leading-relaxed tracking-normal text-muted-foreground">
							Where do you want to go today?
						</p>
					</div>

					<div class="flex w-full items-center justify-evenly">
						{#each centerItems as item}
							<Dialog.Close class="text-left" title={item.label}>
								<a
									href={item.href}
									class="group flex items-center gap-3 rounded-md border-2 border-primary/40 bg-card p-2 text-foreground shadow-sm shadow-primary transition-all duration-150 hover:border-primary hover:text-primary">
									<item.icon class="h-4 w-4 stroke-2" />
								</a>
							</Dialog.Close>
						{/each}
					</div>
				</div>

				<div class="flex flex-col justify-center gap-4">
					{#each navItems.filter(i => i.side === "right") as item}
						<Dialog.Close class="w-full text-left">
							<a
								href={item.href}
								class="group flex items-center gap-3 rounded-md border-2 border-primary/40 bg-card px-4 py-3 text-foreground shadow-sm shadow-primary transition-all duration-150 hover:border-primary hover:bg-card/70 hover:text-primary">
								<div
									class="rounded border border-primary/20 bg-secondary p-1.5 text-secondary-foreground transition-colors group-hover:border-primary/50 group-hover:text-primary">
									<item.icon class="h-4 w-4 stroke-2" />
								</div>

								<span class="font-note text-xs font-bold tracking-wider uppercase">
									{item.label}
								</span>
							</a>
						</Dialog.Close>
					{/each}

					{#if isAdmin}
						<Dialog.Close class="w-full text-left">
							<a
								href="/admin"
								class="group flex items-center gap-3 rounded-md border-2 border-primary/60 bg-card px-4 py-3 text-primary shadow-sm shadow-primary transition-all duration-150 hover:border-primary-hover">
								<div
									class="rounded border border-primary/20 bg-secondary p-1.5 text-primary/80 transition-colors group-hover:border-primary/50 group-hover:text-primary">
									<ShieldUser class="h-4 w-4 stroke-2" />
								</div>

								<span class="font-note text-xs font-bold tracking-wider uppercase"> Admin Dash </span>
							</a>
						</Dialog.Close>
					{/if}
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Root>
</div>
