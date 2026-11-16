<script lang="ts">
	import { onMount } from "svelte"
	import { browser } from "$app/environment"
	import { PUBLIC_TURNED_OFF } from "$env/static/public"

	type LenisInstance = {
		raf: (time: number) => void
		destroy: () => void
	}

	type LenisConstructor = new (options: {
		anchors: boolean
		duration: number
		easing: (progress: number) => number
		smoothWheel: boolean
	}) => LenisInstance

	let { data } = $props()
	let openFaq = $state<number | null>(null)
	let shopItems: { itemID: string; name: string; cdnImage: string }[] = $state([])
	let shopItemsError = $state(false)

	let hasaccessToken = $state(
		browser && document.cookie.split("; ").find(row => row.startsWith("slack_id=")) !== undefined
	)

	let authUrl = $derived(
		PUBLIC_TURNED_OFF !== "false" ? `./turned-off` : hasaccessToken ? `./dashboard/projects` : `/auth`
	)

	function toggleFaq(question: number) {
		openFaq = openFaq === question ? null : question
	}

	onMount(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

		let disposed = false
		let lenis: LenisInstance | undefined
		let frameId = 0

		const script = document.createElement("script")
		script.src = "https://cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.min.js"
		script.async = true
		script.onload = () => {
			if (disposed) return
			const Lenis = (window as Window & { Lenis?: LenisConstructor }).Lenis
			if (!Lenis) {
				console.error("Lenis loaded without exposing its constructor")
				return
			}

			lenis = new Lenis({
				anchors: true,
				duration: 1.2,
				easing: (progress: number) => Math.min(1, 1.001 - Math.pow(2, -10 * progress)),
				smoothWheel: true,
			})

			const raf = (time: number) => {
				lenis?.raf(time)
				frameId = requestAnimationFrame(raf)
			}
			frameId = requestAnimationFrame(raf)
		}
		script.onerror = () => {
			console.error("Failed to load Lenis for homepage smooth scrolling")
		}
		document.head.appendChild(script)

		return () => {
			disposed = true
			cancelAnimationFrame(frameId)
			lenis?.destroy()
			script.remove()
		}
	})

	onMount(() => {
		if (data.error) {
			alert(data.error)
		}
		hasaccessToken = document.cookie.split("; ").find(row => row.startsWith("slack_id=")) !== undefined

		authUrl = PUBLIC_TURNED_OFF !== "false" ? `./turned-off` : hasaccessToken ? `./dashboard` : `/auth`
		fetch("/api/shop/items")
			.then(response => {
				if (!response.ok) {
					throw new Error(`Shop items request failed with status ${response.status}`)
				}
				return response.json()
			})
			.then(items => (shopItems = items))
			.catch(error => {
				console.error("Failed to load homepage shop items", error)
				shopItemsError = true
			})
	})
</script>

<header class="pointer-events-none fixed inset-x-0 top-0 z-1000 h-16" id="site-header">
	<div class="flex h-full max-w-full items-center justify-end px-10">
		<div class="flex-1"></div>
		<a
			href={authUrl}
			type="button"
			class="pointer-events-auto mt-5 mr-6 inline-flex cursor-pointer items-center justify-center rounded-sm bg-chart-3 px-5 py-2.5 font-note text-sm font-semibold tracking-[0.03em] text-foreground shadow-[0px_4px_0px_0px] shadow-chart-3/20 transition-all duration-300 ease-in-out hover:bg-chart-3/80 active:translate-y-[3px]"
			id="btn-header-oauth">
			Sign in with Hack Club
		</a>
	</div>
</header>

<section id="hero" class="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background">
	<div
		class="relative z-2 mx-auto grid min-h-screen w-full max-w-[1440px] grid-cols-2 items-center gap-12 px-12 pt-[100px] pb-20">
		<div class="flex flex-col items-start gap-5">
			<img
				src="assets/Alchemize.png"
				alt="Alchemize Logo"
				class="-mb-8 h-[130px] w-[440px] object-contain object-left" />

			<p class="max-w-[540px] text-[1.15rem] leading-[1.8] text-muted-foreground">
				Make themed projects, get themed prizes! With more mixing this time!
			</p>

			<div class="flex flex-col items-start gap-4">
				<div class="flex h-[52px] items-stretch overflow-hidden rounded-sm border-2 border-border">
					<input
						type="email"
						id="hero-email"
						class="w-[300px] bg-card/35 px-5 text-[1rem] text-foreground outline-none placeholder:text-muted-foreground/70"
						placeholder="you@example.com"
						aria-label="Email address" />
					<a
						href={authUrl}
						type="button"
						class="inline-flex cursor-pointer items-center justify-center border-l-2 border-border bg-primary px-7 text-lg font-semibold tracking-[0.03em] text-primary-foreground transition-all duration-300 ease-[ease] hover:bg-primary/80 active:translate-y-[2px]"
						id="btn-sign-in">Sign In</a>
				</div>
			</div>
		</div>

		<div class="flex h-full items-center justify-center">
			<div class="group/potion-cluster pointer-events-none relative h-[480px] w-full max-w-[560px]">
				<div class="hero-potion-float pointer-events-auto absolute top-[26%] left-[34%] w-[190px] sm:w-[220px]">
					<img
						alt=""
						src="/pmix_v2.png"
						class="w-full rotate-[-5deg] object-contain transition-transform duration-500 ease-out group-hover/potion-cluster:-translate-y-10 group-hover/potion-cluster:scale-110 group-hover/potion-cluster:drop-shadow-lg motion-reduce:transition-none"
						aria-hidden="true" />
				</div>
				<div
					class="hero-potion-float pointer-events-auto absolute top-[7%] left-[7%] w-[105px] sm:w-[135px]"
					style="animation-delay: -1.2s;">
					<img
						alt=""
						src="/pmix_v2.png"
						class="w-full rotate-[14deg] object-contain transition-transform duration-500 ease-out group-hover/potion-cluster:-translate-x-10 group-hover/potion-cluster:-translate-y-8 group-hover/potion-cluster:rotate-[22deg] group-hover/potion-cluster:drop-shadow-lg motion-reduce:transition-none"
						aria-hidden="true" />
				</div>
				<div
					class="hero-potion-float pointer-events-auto absolute top-[10%] right-[6%] w-[110px] sm:w-[140px]"
					style="animation-delay: -2.8s;">
					<img
						alt=""
						src="/pmix_v2.png"
						class="w-full rotate-[-14deg] object-contain transition-transform duration-500 ease-out group-hover/potion-cluster:translate-x-10 group-hover/potion-cluster:-translate-y-8 group-hover/potion-cluster:rotate-[-22deg] group-hover/potion-cluster:drop-shadow-lg motion-reduce:transition-none"
						aria-hidden="true" />
				</div>
				<div
					class="hero-potion-float pointer-events-auto absolute bottom-[3%] left-[15%] w-[115px] sm:w-[145px]"
					style="animation-delay: -3.6s;">
					<img
						alt=""
						src="/pmix_v2.png"
						class="w-full rotate-[-12deg] object-contain transition-transform duration-500 ease-out group-hover/potion-cluster:-translate-x-10 group-hover/potion-cluster:translate-y-8 group-hover/potion-cluster:rotate-[-20deg] group-hover/potion-cluster:drop-shadow-lg motion-reduce:transition-none"
						aria-hidden="true" />
				</div>
				<div
					class="hero-potion-float pointer-events-auto absolute right-[11%] bottom-[4%] w-[105px] sm:w-[135px]"
					style="animation-delay: -4.4s;">
					<img
						alt=""
						src="/pmix_v2.png"
						class="w-full rotate-[16deg] object-contain transition-transform duration-500 ease-out group-hover/potion-cluster:translate-x-10 group-hover/potion-cluster:translate-y-8 group-hover/potion-cluster:rotate-[24deg] group-hover/potion-cluster:drop-shadow-lg motion-reduce:transition-none"
						aria-hidden="true" />
				</div>
			</div>
		</div>
	</div>
</section>

<section
	id="how-it-works"
	class="relative flex min-h-screen w-full items-center justify-center overflow-hidden"
	style="background-color: color-mix(in srgb, var(--background) 92%, var(--primary));">
	<div class="max-w-content relative z-2 mx-auto w-full px-12 py-12">
		<h2 class="mb-3 text-center font-heading text-[3rem] font-bold tracking-[-0.02em] text-foreground">
			How does this work?
		</h2>
		<p class="mb-12 text-center text-[1.15rem] text-muted-foreground">All about Alchemize!!!</p>

		<div class="mx-auto grid max-w-[1000px] grid-cols-1 gap-6 md:grid-cols-2">
			<article
				class="group overflow-hidden rounded-tl-3xl rounded-br-3xl border border-border bg-card transition-colors duration-500 ease-[ease] hover:border-primary/70 hover:bg-card/70 motion-reduce:transition-none">
				<div class="flex h-72 items-center justify-center bg-secondary/20 p-5">
					<img
						src="assets/step_1.png"
						alt="Alchemize character choosing potions"
						class="h-full w-full object-contain transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] motion-reduce:transition-none" />
				</div>
				<div class="p-6">
					<div class="mb-2 flex items-center gap-3">
						<span
							class="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-base font-extrabold text-foreground transition-transform duration-500 ease-[ease] group-hover:scale-110 group-hover:-rotate-6 motion-reduce:transition-none"
							>1</span>
						<h3 class="font-heading text-xl font-bold text-foreground">Pick an Idea</h3>
					</div>
					<p class="text-sm leading-relaxed text-muted-foreground">
						Got your own idea? Build it. Make something completely crazy. Just pick a project you're actually interested
						to build!
					</p>
				</div>
			</article>

			<article
				class="group overflow-hidden rounded-tl-3xl rounded-br-3xl border border-border bg-card transition-colors duration-500 ease-[ease] hover:border-primary/70 hover:bg-card/70 motion-reduce:transition-none">
				<div class="flex h-72 items-center justify-center bg-secondary/20 p-5">
					<img
						src="assets/step_2.png"
						alt="Alchemize character building a project"
						class="h-full w-full object-contain transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] motion-reduce:transition-none" />
				</div>
				<div class="p-6">
					<div class="mb-2 flex items-center gap-3">
						<span
							class="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-base font-extrabold text-foreground transition-transform duration-500 ease-[ease] group-hover:scale-110 group-hover:-rotate-6 motion-reduce:transition-none"
							>2</span>
						<h3 class="font-heading text-xl font-bold text-foreground">Build the Project</h3>
					</div>
					<p class="text-sm leading-relaxed text-muted-foreground">
						Turn your idea into a real, working project. Code it, design it, and ship it, just remember to track your
						hours as you build.
					</p>
				</div>
			</article>

			<article
				class="group rounded-tl-3xl rounded-br-3xl border border-border bg-card p-6 transition-colors duration-500 ease-[ease] hover:border-primary/70 hover:bg-card/70 motion-reduce:transition-none">
				<div class="mb-2 flex items-center gap-3">
					<span
						class="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-base font-extrabold text-foreground transition-transform duration-500 ease-[ease] group-hover:scale-110 group-hover:-rotate-6 motion-reduce:transition-none"
						>3</span>
					<h3 class="font-heading text-xl font-bold text-foreground">Submit It for Review</h3>
				</div>
				<p class="text-sm leading-relaxed text-muted-foreground">
					Once your project is ready, submit it with your code and a link to try it out. Our reviewers will check it and
					approve your hours.
				</p>
			</article>

			<article
				class="group rounded-tl-3xl rounded-br-3xl border border-border bg-card p-6 transition-colors duration-500 ease-[ease] hover:border-primary/70 hover:bg-card/70 motion-reduce:transition-none">
				<div class="mb-2 flex items-center gap-3">
					<span
						class="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-base font-extrabold text-foreground transition-transform duration-500 ease-[ease] group-hover:scale-110 group-hover:-rotate-6 motion-reduce:transition-none"
						>4</span>
					<h3 class="font-heading text-xl font-bold text-foreground">Spend Your Stones!</h3>
				</div>
				<p class="text-sm leading-relaxed text-muted-foreground">
					Every approved hour earns you Aqua Regia. Spend it in the shop on amazing rewards like hardware, tools, and
					licenses to help your next project.
				</p>
			</article>
		</div>
	</div>
</section>

<section
	id="prizes"
	class="relative flex min-h-screen w-full items-center justify-center overflow-hidden"
	style="background-color: color-mix(in srgb, var(--background) 88%, var(--secondary));">
	<div class="max-w-content relative z-2 mx-auto flex w-full flex-col items-center px-12 pt-[60px] pb-10">
		<h2 class="mb-3 text-center font-heading text-[3rem] font-bold tracking-[-0.02em] text-foreground">The Shop</h2>
		<p class="mb-12 text-center text-[1.15rem] text-muted-foreground">Ship real projects. Earn real rewards.</p>

		<div
			class="group relative mt-8 w-full overflow-hidden rounded-md border-2 border-border py-4"
			data-marquee
			aria-label="Prize items scrolling ribbon forward">
			<div
				class="flex w-max animate-marquee will-change-transform group-hover:[animation-play-state:paused]"
				id="marquee-track-1"
				data-marquee-track>
				{#if shopItemsError}
					<p class="px-10 text-sm text-muted-foreground">Shop items are temporarily unavailable.</p>
				{:else}
					<div class="flex shrink-0 items-center gap-10 pr-10">
						{#each shopItems as item (item.itemID)}
							<div class="flex w-[180px] shrink-0 flex-col items-center gap-2.5">
								<div class="relative flex h-[100px] w-[140px] items-center justify-center">
									<img src={item.cdnImage} alt={item.name} class="max-h-full max-w-full object-contain" />
								</div>
								<span class="text-center text-[0.85rem] font-semibold whitespace-nowrap text-muted-foreground"
									>{item.name}</span>
							</div>
						{/each}
					</div>
					<div class="flex shrink-0 items-center gap-10 pr-10" aria-hidden="true">
						{#each shopItems as item (item.itemID)}
							<div class="flex w-[180px] shrink-0 flex-col items-center gap-2.5">
								<div class="relative flex h-[100px] w-[140px] items-center justify-center">
									<img src={item.cdnImage} alt={item.name} class="max-h-full max-w-full object-contain" />
								</div>
								<span class="text-center text-[0.85rem] font-semibold whitespace-nowrap text-muted-foreground"
									>{item.name}</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<div
			class="group relative mt-[calc(14px+1rem)] mb-12 w-full overflow-hidden rounded-md border-2 border-border py-4"
			data-marquee
			aria-label="Prize items scrolling ribbon reverse">
			<div
				class="flex w-max animate-marquee-reverse will-change-transform group-hover:[animation-play-state:paused]"
				id="marquee-track-2"
				data-marquee-track>
				{#if shopItemsError}
					<p class="px-10 text-sm text-muted-foreground">Shop items are temporarily unavailable.</p>
				{:else}
					<div class="flex shrink-0 items-center gap-10 pr-10">
						{#each shopItems as item (item.itemID)}
							<div class="flex w-[180px] shrink-0 flex-col items-center gap-2.5">
								<div class="relative flex h-[100px] w-[140px] items-center justify-center">
									<img src={item.cdnImage} alt={item.name} class="max-h-full max-w-full object-contain" />
								</div>
								<span class="text-center text-[0.85rem] font-semibold whitespace-nowrap text-muted-foreground"
									>{item.name}</span>
							</div>
						{/each}
					</div>
					<div class="flex shrink-0 items-center gap-10 pr-10" aria-hidden="true">
						{#each shopItems as item (item.itemID)}
							<div class="flex w-[180px] shrink-0 flex-col items-center gap-2.5">
								<div class="relative flex h-[100px] w-[140px] items-center justify-center">
									<img src={item.cdnImage} alt={item.name} class="max-h-full max-w-full object-contain" />
								</div>
								<span class="text-center text-[0.85rem] font-semibold whitespace-nowrap text-muted-foreground"
									>{item.name}</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</section>

<section
	id="faq"
	class="relative flex min-h-screen w-full items-center justify-center overflow-hidden"
	style="background-color: color-mix(in srgb, var(--background) 80%, var(--secondary));">
	<div class="relative z-2 mx-auto w-full max-w-[820px] px-12 py-20">
		<div class="mb-12 flex w-full items-center justify-center">
			<img src="/assets/FAQ.png" alt="Alchemize FAQ" class=" -mb-8 h-[100px] object-contain object-left" />
		</div>

		<p
			class="mb-8 rounded-lg border border-primary/40 bg-card/50 px-5 py-4 text-center text-sm font-semibold text-foreground"
			role="status">
			Season 2 docs are coming soon. Check back for the latest program details!
		</p>

		<div class="flex flex-col" id="faq-accordion">
			<div class="border-b-2 border-border first:border-t-2">
				<button
					class="group flex w-full cursor-pointer items-center justify-between px-2 py-[22px] text-left text-[1.1rem] font-semibold text-foreground transition-colors duration-300 ease-[ease] hover:text-primary"
					onclick={() => toggleFaq(1)}
					aria-expanded={openFaq === 1}
					id="faq-btn-1"
					aria-controls="faq-panel-1">
					<span>Who is eligible?</span>
					<span
						class="relative ml-5 size-6 shrink-0 before:absolute before:top-1/2 before:left-1/2 before:h-[3px] before:w-[18px] before:-translate-1/2 before:rounded-[2px] before:bg-primary before:transition-colors before:duration-300 group-aria-expanded:before:bg-primary after:absolute after:top-1/2 after:left-1/2 after:h-[18px] after:w-[3px] after:-translate-1/2 after:rounded-[2px] after:bg-primary after:transition-all after:duration-300 group-aria-expanded:after:rotate-90 group-aria-expanded:after:bg-primary group-aria-expanded:after:opacity-0"
						aria-hidden="true"></span>
				</button>
				<div
					class="grid overflow-hidden transition-[grid-template-rows] duration-400 ease-[ease]"
					style:grid-template-rows={openFaq === 1 ? "1fr" : "0fr"}
					id="faq-panel-1"
					role="region"
					aria-labelledby="faq-btn-1">
					<div class="min-h-0 overflow-hidden">
						<p class="px-2 pb-6 text-[0.95rem] leading-[1.75] text-muted-foreground">
							Anyone aged 13 through 18! Everyone from all over the world can participate.
						</p>
					</div>
				</div>
			</div>

			<div class="border-b-2 border-border first:border-t-2">
				<button
					class="group flex w-full cursor-pointer items-center justify-between px-2 py-[22px] text-left text-[1.1rem] font-semibold text-foreground transition-colors duration-300 ease-[ease] hover:text-primary"
					onclick={() => toggleFaq(2)}
					aria-expanded={openFaq === 2}
					id="faq-btn-2"
					aria-controls="faq-panel-2">
					<span>Is this free and legitimate?</span>
					<span
						class="relative ml-5 size-6 shrink-0 before:absolute before:top-1/2 before:left-1/2 before:h-[3px] before:w-[18px] before:-translate-1/2 before:rounded-[2px] before:bg-primary before:transition-colors before:duration-300 group-aria-expanded:before:bg-primary after:absolute after:top-1/2 after:left-1/2 after:h-[18px] after:w-[3px] after:-translate-1/2 after:rounded-[2px] after:bg-primary after:transition-all after:duration-300 group-aria-expanded:after:rotate-90 group-aria-expanded:after:bg-primary group-aria-expanded:after:opacity-0"
						aria-hidden="true"></span>
				</button>
				<div
					class="grid overflow-hidden transition-[grid-template-rows] duration-400 ease-[ease]"
					style:grid-template-rows={openFaq === 2 ? "1fr" : "0fr"}
					id="faq-panel-2"
					role="region"
					aria-labelledby="faq-btn-2">
					<div class="min-h-0 overflow-hidden">
						<p class="px-2 pb-6 text-[0.95rem] leading-[1.75] text-muted-foreground">
							Yes! Alchemize is a Hack Club program. Hack Club is a 501(c)(3) nonprofit, and donations from people like
							<a
								href="https://en.wikipedia.org/wiki/Michael_Dell"
								target="_blank"
								rel="noopener noreferrer"
								class="text-primary underline underline-offset-2 hover:text-primary-hover">Michael Dell</a>
							and
							<a
								href="https://en.wikipedia.org/wiki/Tom_Preston-Werner"
								target="_blank"
								rel="noopener noreferrer"
								class="text-primary underline underline-offset-2 hover:text-primary-hover">Tom Preston-Werner</a>
							help cover the prizes. Hack Club has also run programs like
							<a
								href="https://highseas.hackclub.com/"
								target="_blank"
								rel="noopener noreferrer"
								class="text-primary underline underline-offset-2 hover:text-primary-hover">High Seas</a
							>,
							<a
								href="https://summer.hackclub.com/"
								target="_blank"
								rel="noopener noreferrer"
								class="text-primary underline underline-offset-2 hover:text-primary-hover">Summer of Making</a
							>, and
							<a
								href="https://flavortown.hackclub.com/"
								target="_blank"
								rel="noopener noreferrer"
								class="text-primary underline underline-offset-2 hover:text-primary-hover">Flavortown</a
							>.
						</p>
					</div>
				</div>
			</div>

			<div class="border-b-2 border-border first:border-t-2">
				<button
					class="group flex w-full cursor-pointer items-center justify-between px-2 py-[22px] text-left text-[1.1rem] font-semibold text-foreground transition-colors duration-300 ease-[ease] hover:text-primary"
					onclick={() => toggleFaq(3)}
					aria-expanded={openFaq === 3}
					id="faq-btn-3"
					aria-controls="faq-panel-3">
					<span>What projects count?</span>
					<span
						class="relative ml-5 size-6 shrink-0 before:absolute before:top-1/2 before:left-1/2 before:h-[3px] before:w-[18px] before:-translate-1/2 before:rounded-[2px] before:bg-primary before:transition-colors before:duration-300 group-aria-expanded:before:bg-primary after:absolute after:top-1/2 after:left-1/2 after:h-[18px] after:w-[3px] after:-translate-1/2 after:rounded-[2px] after:bg-primary after:transition-all after:duration-300 group-aria-expanded:after:rotate-90 group-aria-expanded:after:bg-primary group-aria-expanded:after:opacity-0"
						aria-hidden="true"></span>
				</button>
				<div
					class="grid overflow-hidden transition-[grid-template-rows] duration-400 ease-[ease]"
					style:grid-template-rows={openFaq === 3 ? "1fr" : "0fr"}
					id="faq-panel-3"
					role="region"
					aria-labelledby="faq-btn-3">
					<div class="min-h-0 overflow-hidden">
						<p class="px-2 pb-6 text-[0.95rem] leading-[1.75] text-muted-foreground">
							Software projects count, as long as they're open-source.
						</p>
					</div>
				</div>
			</div>

			<div class="border-b-2 border-border first:border-t-2">
				<button
					class="group flex w-full cursor-pointer items-center justify-between px-2 py-[22px] text-left text-[1.1rem] font-semibold text-foreground transition-colors duration-300 ease-[ease] hover:text-primary"
					onclick={() => toggleFaq(4)}
					aria-expanded={openFaq === 4}
					id="faq-btn-4"
					aria-controls="faq-panel-4">
					<span>Does hardware count?</span>
					<span
						class="relative ml-5 size-6 shrink-0 before:absolute before:top-1/2 before:left-1/2 before:h-[3px] before:w-[18px] before:-translate-1/2 before:rounded-[2px] before:bg-primary before:transition-colors before:duration-300 group-aria-expanded:before:bg-primary after:absolute after:top-1/2 after:left-1/2 after:h-[18px] after:w-[3px] after:-translate-1/2 after:rounded-[2px] after:bg-primary after:transition-all after:duration-300 group-aria-expanded:after:rotate-90 group-aria-expanded:after:bg-primary group-aria-expanded:after:opacity-0"
						aria-hidden="true"></span>
				</button>
				<div
					class="grid overflow-hidden transition-[grid-template-rows] duration-400 ease-[ease]"
					style:grid-template-rows={openFaq === 4 ? "1fr" : "0fr"}
					id="faq-panel-4"
					role="region"
					aria-labelledby="faq-btn-4">
					<div class="min-h-0 overflow-hidden">
						<p class="px-2 pb-6 text-[0.95rem] leading-[1.75] text-muted-foreground">
							Not at this time. Alchemize currently supports software projects only; we do not yet have the review and
							tracking process needed to assess hardware submissions consistently. If this changes, we’ll share an
							update through our official channels.
						</p>
					</div>
				</div>
			</div>

			<div class="border-b-2 border-border first:border-t-2">
				<button
					class="group flex w-full cursor-pointer items-center justify-between px-2 py-[22px] text-left text-[1.1rem] font-semibold text-foreground transition-colors duration-300 ease-[ease] hover:text-primary"
					onclick={() => toggleFaq(5)}
					aria-expanded={openFaq === 5}
					id="faq-btn-5"
					aria-controls="faq-panel-5">
					<span>I've got more questions...</span>
					<span
						class="relative ml-5 size-6 shrink-0 before:absolute before:top-1/2 before:left-1/2 before:h-[3px] before:w-[18px] before:-translate-1/2 before:rounded-[2px] before:bg-primary before:transition-colors before:duration-300 group-aria-expanded:before:bg-primary after:absolute after:top-1/2 after:left-1/2 after:h-[18px] after:w-[3px] after:-translate-1/2 after:rounded-[2px] after:bg-primary after:transition-all after:duration-300 group-aria-expanded:after:rotate-90 group-aria-expanded:after:bg-primary group-aria-expanded:after:opacity-0"
						aria-hidden="true"></span>
				</button>
				<div
					class="grid overflow-hidden transition-[grid-template-rows] duration-400 ease-[ease]"
					style:grid-template-rows={openFaq === 5 ? "1fr" : "0fr"}
					id="faq-panel-5"
					role="region"
					aria-labelledby="faq-btn-5">
					<div class="min-h-0 overflow-hidden">
						<p class="px-2 pb-6 text-[0.95rem] leading-[1.75] text-muted-foreground">
							If you're on Hack Club Slack, send a message in
							<a
								href="https://hackclub.enterprise.slack.com/archives/C0ASVK0HHEX"
								target="_blank"
								rel="noopener noreferrer"
								class="text-primary underline underline-offset-2 hover:text-primary-hover">#alchemize-help</a
							>. We'll be happy to help and answer your questions.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<footer class="border-t-3 border-border px-12 pt-16" id="footer" style="background-color: var(--background);">
	<div class="max-w-content mx-auto flex items-start justify-between gap-12 pb-12">
		<div class="flex flex-col gap-3">
			<img src="assets/Alchemize.png" alt="Alchemize Logo" class="-mb-3 h-16 w-[240px] object-contain object-left" />
			<p class="max-w-80 text-[0.82rem] leading-[1.65] text-muted-foreground">
				A Hack Club program. Hack Club is a 501(c)(3) non-profit with a network of more than 100,000 teenagers in 119
				countries, all of them learning by shipping.
			</p>
		</div>

		<nav class="grid grid-cols-[repeat(3,auto)] gap-14" aria-label="Footer navigation">
			<div>
				<h4 class="mb-5 text-[0.75rem] font-extrabold tracking-[0.12em] text-primary uppercase">ALCHEMIZE</h4>
				<ul class="*:mb-3">
					<li>
						<a
							class="text-[0.9rem] text-muted-foreground transition-colors duration-300 ease-[ease] hover:text-foreground"
							href="#">Home</a>
					</li>
					<li>
						<a
							class="text-[0.9rem] text-muted-foreground transition-colors duration-300 ease-[ease] hover:text-foreground"
							href="#how-it-works">How it works</a>
					</li>
					<li>
						<a
							class="text-[0.9rem] text-muted-foreground transition-colors duration-300 ease-[ease] hover:text-foreground"
							href="#prizes">The shop</a>
					</li>
				</ul>
			</div>

			<div>
				<h4 class="mb-5 text-[0.75rem] font-extrabold tracking-[0.12em] text-primary uppercase">HACK CLUB</h4>
				<ul class="*:mb-3">
					<li>
						<a
							class="text-[0.9rem] text-muted-foreground transition-colors duration-300 ease-[ease] hover:text-foreground"
							href="https://hackclub.com/philosophy"
							target="_blank"
							rel="noopener">Philosophy</a>
					</li>
					<li>
						<a
							class="text-[0.9rem] text-muted-foreground transition-colors duration-300 ease-[ease] hover:text-foreground"
							href="https://hackclub.com/team"
							target="_blank"
							rel="noopener">Team</a>
					</li>
					<li>
						<a
							class="text-[0.9rem] text-muted-foreground transition-colors duration-300 ease-[ease] hover:text-foreground"
							href="https://hackclub.com/donate"
							target="_blank"
							rel="noopener">Donate</a>
					</li>
					<li>
						<a
							class="text-[0.9rem] text-muted-foreground transition-colors duration-300 ease-[ease] hover:text-foreground"
							href="https://hackclub.com/brand"
							target="_blank"
							rel="noopener">Branding</a>
					</li>
				</ul>
			</div>

			<div>
				<h4 class="mb-5 text-[0.75rem] font-extrabold tracking-[0.12em] text-primary uppercase">HELP</h4>
				<ul class="*:mb-3">
					<li>
						<a
							class="text-[0.9rem] text-muted-foreground transition-colors duration-300 ease-[ease] hover:text-foreground"
							href="https://hackclub.enterprise.slack.com/archives/C0ASVK0HHEX"
							target="_blank"
							rel="noopener">#alchemize-help on Slack</a>
					</li>
					<li>
						<a
							class="text-[0.9rem] text-muted-foreground transition-colors duration-300 ease-[ease] hover:text-foreground"
							href="mailto:identity@hackclub.com">identity@hackclub.com</a>
					</li>
					<li>
						<a
							class="text-[0.9rem] text-muted-foreground transition-colors duration-300 ease-[ease] hover:text-foreground"
							href="https://forms.hackclub.com/bounty">Fulfilment bounty</a>
					</li>
					<li>
						<a
							class="text-[0.9rem] text-muted-foreground transition-colors duration-300 ease-[ease] hover:text-foreground"
							href="https://hackclub.com/conduct"
							target="_blank"
							rel="noopener">Code of conduct</a>
					</li>
					<li>
						<a
							class="text-[0.9rem] text-muted-foreground transition-colors duration-300 ease-[ease] hover:text-foreground"
							href="https://hackclub.com/privacy"
							target="_blank"
							rel="noopener">Privacy &amp; terms</a>
					</li>
				</ul>
			</div>
		</nav>
	</div>

	<div class="max-w-content mx-auto border-t border-border py-6 text-center">
		<p class="text-[0.8rem] tracking-[0.02em] text-muted-foreground">
			Sponsored by, <a href="https://hackclub.enterprise.slack.com/team/U01PJ08PR7S">Josias</a>
		</p>
	</div>
</footer>

<style>
	.hero-potion-float {
		animation: hero-potion-float 5.5s ease-in-out infinite;
	}

	@keyframes hero-potion-float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.hero-potion-float {
			animation: none;
		}
	}
</style>
