<script>
	import Button from "$lib/components/ui/button/button.svelte"
	import { Input } from "$lib/components/ui/input/index.js" // Import Shadcn Input
	import { Plus, Compass, ArrowUpRight, Clock, Search } from "@lucide/svelte"
	import { Filter } from "lucide-svelte"

	let projects = $state([
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
	class="min-h-screen overflow-scroll w-full bg-gradbg text-foreground p-6 md:p-10 font-mono tracking-wide selection:bg-primary selection:text-primary-foreground"
>
	<div class="relative z-50 max-w-7xl mx-auto flex flex-col gap-5 h-screen">
		<div
			class="flex items-end justify-between border-b-2 pb-[clamp(5px,1vh,16px)] border-primary/30 h-[clamp(40px,8vh,80px)] mt-5"
		>
			<div class="flex items-center gap-3">
				<Compass class="h-4 w-4 animate-pulse text-primary" />
				<h1
					class="text-2xl font-alchemize font-black uppercase tracking-wider line-clamp-1 text-primary"
				>
					Explore <span class="text-[0.5rem] text-white">Alchemize</span>
				</h1>
			</div>

			<Button
				size="sm"
				variant="outline"
				class="border-2 border-primary bg-background text-white hover:bg-primary hover:text-primary-foreground font-bold tracking-wider uppercase rounded-xl transition-all duration-100 shadow-[2px_2px_0px_0px_rgba(var(--primary),0.3)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none mr-10"
			>
				<Filter class="size-4 mr-1 stroke-3" />
				<span>Your mixes</span>
			</Button>
		</div>

		<div class="relative w-full">
			<Search
				class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400"
			/>
			<Input
				type="text"
				placeholder="Search mixes..."
				bind:value={searchQuery}
				class="pl-10 border-2 border-primary/30 bg-black/40 text-white rounded focus-visible:ring-primary"
			/>
		</div>

		<div
			class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start max-h-9/10"
		>
			{#each filteredProjects as project (project.id)}
				<div class="relative group">
					<div
						class="absolute inset-0 bg-primary/80 translate-x-[6px] translate-y-[6px] rounded-sm transition-transform group-hover:translate-x-[4px] group-hover:translate-y-[4px]"
					></div>

					<button
						class="relative w-full text-left flex flex-col bg-black/95 border-2 border-primary/90 rounded-sm overflow-hidden h-[190px] p-4 transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px] focus:outline-none focus:ring-1 focus:ring-primary"
					>
						<div
							class="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-45 group-hover:opacity-65 transition-opacity duration-200"
						>
							<img
								src="/Alchemize.png"
								alt=""
								class="w-full h-full object-cover scale-100 group-hover:scale-[1.03] transition-transform duration-300"
							/>
							<div
								class="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-black/75"
							></div>
						</div>

						<div
							class="relative z-10 w-full h-full flex flex-col justify-between"
						>
							<div
								class="flex flex-col items-start justify-start gap-y-2 w-full h-full"
							>
								<div class="w-full flex items-center justify-between gap-4">
									<h2
										class="text-2xl font-black tracking-tight text-white line-clamp-1 [text-shadow:0_2px_4px_rgba(0,0,0,0.8)] font-alchemize"
									>
										{project.name}
									</h2>

									<span
										class="text-xs font-bold text-zinc-300 px-2 py-0.5 border-zinc-800 rounded-none flex items-center gap-1.5 shrink-0 shadow-md"
									>
										<Clock class="size-4 text-primary" />
										{project.duration}
									</span>
								</div>

								<p
									class="text-zinc-300 text-sm leading-relaxed line-clamp-3 font-sans tracking-normal max-w-[92%] [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]"
								>
									{project.description}
								</p>
							</div>

							<div class="flex items-center justify-end gap-x-2 p-0">
								<a href="/" target="_blank">
									<Button
										class="border-2 border-primary bg-background text-white hover:bg-primary hover:text-primary-foreground text-[10px] font-bold tracking-wider uppercase rounded-xl transition-all duration-100 active:-translate-x-0.5 active:-translate-y-0.5 active:shadow-none py-1"
									>
										<div class="flex items-center justify-end w-full gap-x-2">
											<ArrowUpRight class="size-3.5 opacity-80" />
											<span>Repository</span>
										</div>
									</Button>
								</a>
								<a href="/" target="_blank">
									<Button
										class="border-2 border-primary bg-background text-white hover:bg-primary hover:text-primary-foreground text-[10px] font-bold tracking-wider uppercase rounded-xl transition-all duration-100 active:-translate-x-0.5 active:-translate-y-0.5 active:shadow-none py-1"
									>
										<div class="flex items-center justify-end w-full gap-x-2">
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
				<p class="text-zinc-400 col-span-full text-center py-10">
					No mixes found matching "{searchQuery}"
				</p>
			{/each}
		</div>
	</div>
</main>
