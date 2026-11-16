<script>
	import Button from "$lib/components/ui/button/button.svelte"
	import { Input } from "$lib/components/ui/input/index.js" // Import Shadcn Input
	import { Compass, ArrowUpRight, Clock, Search } from "@lucide/svelte"
	import { Filter } from "lucide-svelte"

	const projects = $state([
		{
			id: 1,
			name: "Untitled mix",
			description: "test 123",
			duration: "10 hrs",
		},
		{
			id: 2,
			name: "alchemize",
			description: "test 123678",
			duration: "4 hrs",
		},
		{
			id: 3,
			name: "Untitled 2",
			description: "test 1237890",
			duration: "24 hrs",
		},
	])

	let searchQuery = $state("")

	let filteredProjects = $derived(
		projects.filter(
			project =>
				project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				project.description.toLowerCase().includes(searchQuery.toLowerCase())
		)
	)
</script>

<main
	class="bg-gradbg min-h-screen w-full overflow-scroll p-6 font-mono tracking-wide text-foreground selection:bg-primary selection:text-primary-foreground md:p-10">
	<div class="relative z-50 mx-auto flex h-screen max-w-7xl flex-col gap-5">
		<div
			class="mt-5 flex h-[clamp(40px,8vh,80px)] items-end justify-between border-b-2 border-primary/30 pb-[clamp(5px,1vh,16px)]">
			<div class="flex items-center gap-3">
				<Compass class="h-4 w-4 animate-pulse text-primary" />
				<h1 class="line-clamp-1 font-alchemize text-2xl font-black tracking-wider text-primary uppercase">
					Explore <span class="text-[0.5rem] text-primary-foreground">Alchemize</span>
				</h1>
			</div>

			<Button
				size="sm"
				variant="outline"
				class="mr-10 rounded-xl border-2 border-primary bg-background font-bold tracking-wider text-primary-foreground uppercase shadow-[2px_2px_0px_0px_rgba(var(--primary),0.3)] transition-all duration-100 hover:bg-primary hover:text-primary-foreground active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
				<Filter class="mr-1 size-4 stroke-3" />
				<span>Your mixes</span>
			</Button>
		</div>

		<div class="relative w-full">
			<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
			<Input
				type="text"
				placeholder="Search mixes..."
				bind:value={searchQuery}
				class="rounded border-2 border-primary/30 bg-black/40 pl-10 text-primary-foreground focus-visible:ring-primary" />
		</div>

		<div class="grid max-h-9/10 grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each filteredProjects as project (project.id)}
				<div class="group relative">
					<div
						class="absolute inset-0 translate-x-[6px] translate-y-[6px] rounded-sm bg-primary/80 transition-transform group-hover:translate-x-[4px] group-hover:translate-y-[4px]">
					</div>

					<button
						class="relative flex h-[190px] w-full flex-col overflow-hidden rounded-sm border-2 border-primary/90 bg-black/95 p-4 text-left transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px] focus:ring-1 focus:ring-primary focus:outline-none">
						<div
							class="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-45 transition-opacity duration-200 group-hover:opacity-65">
							<img
								src="/pmix_v2.png"
								alt=""
								class="h-full w-full scale-100 object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
							<div class="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-black/75"></div>
						</div>

						<div class="relative z-10 flex h-full w-full flex-col justify-between">
							<div class="flex h-full w-full flex-col items-start justify-start gap-y-2">
								<div class="flex w-full items-center justify-between gap-4">
									<h2
										class="line-clamp-1 font-alchemize text-2xl font-black tracking-tight text-primary-foreground [text-shadow:0_2px_4px_rgba(0,0,0,0.8)]">
										{project.name}
									</h2>

									<span
										class="flex shrink-0 items-center gap-1.5 rounded-none border-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-300 shadow-md">
										<Clock class="size-4 text-primary" />
										{project.duration}
									</span>
								</div>

								<p
									class="line-clamp-3 max-w-[92%] font-sans text-sm leading-relaxed tracking-normal text-zinc-300 [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
									{project.description}
								</p>
							</div>

							<div class="flex items-center justify-end gap-x-2 p-0">
								<a href="/" target="_blank">
									<Button
										class="rounded-xl border-2 border-primary bg-background py-1 text-[10px] font-bold tracking-wider text-primary-foreground uppercase transition-all duration-100 hover:bg-primary hover:text-primary-foreground active:-translate-x-0.5 active:-translate-y-0.5 active:shadow-none">
										<div class="flex w-full items-center justify-end gap-x-2">
											<ArrowUpRight class="size-3.5 opacity-80" />
											<span>Repository</span>
										</div>
									</Button>
								</a>
								<a href="/" target="_blank">
									<Button
										class="rounded-xl border-2 border-primary bg-background py-1 text-[10px] font-bold tracking-wider text-primary-foreground uppercase transition-all duration-100 hover:bg-primary hover:text-primary-foreground active:-translate-x-0.5 active:-translate-y-0.5 active:shadow-none">
										<div class="flex w-full items-center justify-end gap-x-2">
											<ArrowUpRight class="size-3.5 opacity-80" />
											<span>Live Demo</span>
										</div>
									</Button>
								</a>
							</div>
						</div>
					</button>
				</div>
			{:else}
				<p class="col-span-full py-10 text-center text-zinc-400">
					No mixes found matching "{searchQuery}"
				</p>
			{/each}
		</div>
	</div>
</main>
