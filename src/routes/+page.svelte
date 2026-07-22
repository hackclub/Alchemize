<script lang="ts">
	import {
		ArrowDown,
		Blocks,
		ChevronsRight,
		FlaskConical,
		Rocket,
		ShoppingCart,
		X,
		Newspaper,
		LoaderCircleIcon,
	} from "lucide-svelte"
	import { onMount } from "svelte"
	import { browser } from "$app/environment"
	import {
		PUBLIC_HACKCLUB_AUTH,
		PUBLIC_HACKCLUB_REDIRECT,
		PUBLIC_TURNED_OFF,
	} from "$env/static/public"
	import { scopes } from "$lib/utils"
	import Accordion from "$lib/components/accordion.svelte"
	import { ShoppingBag, User } from "@lucide/svelte"

	let { data } = $props()
	let rsvpCount: number | "Fetching" = $state("Fetching")
	let showRotator = $state(false)
	const clientId = PUBLIC_HACKCLUB_AUTH
	const uri = encodeURIComponent(PUBLIC_HACKCLUB_REDIRECT)

	let hasaccessToken = $state(
		browser &&
			document.cookie.split("; ").find(row => row.startsWith("slack_id=")) !==
				undefined
	)

	let authUrl = $derived(
		PUBLIC_TURNED_OFF !== "false"
			? `./turned-off`
			: hasaccessToken
				? `./dashboard`
				: `https://auth.hackclub.com/oauth/authorize?client_id=${clientId}&response_type=code&scope=${scopes}&redirect_uri=${uri}`
	)

	let referUrl = $state(`./refer`)

	const targetDate = new Date("2026-06-21T01:00:00Z").getTime()
	let timeLeft = $state(Math.max(0, targetDate - Date.now()))

	let time = $derived(formatTime(timeLeft))

	$effect(() => {
		const interval = setInterval(() => {
			const difference = targetDate - Date.now()

			if (difference <= 0) {
				timeLeft = 0
				clearInterval(interval)
			} else {
				timeLeft = difference
			}
		}, 1000)

		return () => clearInterval(interval)
	})

	function formatTime(ms: number) {
		if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }

		const seconds = Math.floor((ms / 1000) % 60)
		const minutes = Math.floor((ms / 1000 / 60) % 60)
		const hours = Math.floor((ms / (1000 * 60 * 60)) % 24)
		const days = Math.floor(ms / (1000 * 60 * 60 * 24))

		return {
			days: days.toString().padStart(2, "0"),
			hours: hours.toString().padStart(2, "0"),
			minutes: minutes.toString().padStart(2, "0"),
			seconds: seconds.toString().padStart(2, "0"),
		}
	}

	onMount(() => {
		if (data.error) {
			alert(data.error)
		}
		hasaccessToken =
			document.cookie.split("; ").find(row => row.startsWith("slack_id=")) !==
			undefined

		authUrl =
			PUBLIC_TURNED_OFF !== "false"
				? `./turned-off`
				: hasaccessToken
					? `./dashboard`
					: `https://auth.hackclub.com/oauth/authorize?client_id=${clientId}&response_type=code&scope=${scopes}&redirect_uri=${uri}`
		fetch("/rsvp")
			.then(res => res.json())
			.then(data => (rsvpCount = data.count))

		referUrl =
			PUBLIC_TURNED_OFF !== "false"
				? `./turned-off`
				: hasaccessToken
					? `./refer`
					: `https://auth.hackclub.com/oauth/authorize?client_id=${clientId}&response_type=code&scope=${scopes}&redirect_uri=${uri}`
		fetch("/rsvp")
			.then(res => res.json())
			.then(data => (rsvpCount = data.count))
	})
</script>

<div
	class="fixed -z-20 bg-[url('/alchbg.png')] bg-cover bg-center w-screen h-screen blur-sm"
></div>
<div
	class="relative min-h-screen w-full bg-[linear-gradient(to_bottom,#00000030_20%,#000c_70%)] text-zinc-100 font-mono tracking-wide selection:bg-primary selection:text-primary-foreground overflow-x-hidden"
>
	<div class="fixed inset-0 bg-black/25 z-0 pointer-events-none"></div>

	<div
		class="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-80"
	></div>

	<div
		class="fixed top-0 left-0 w-full md:left-auto md:right-0 md:w-[260px] md:h-[260px] md:overflow-hidden z-50 pointer-events-none"
	>
		<div
			class="w-full h-8 md:absolute md:top-[88px] md:-right-[70px] md:w-[360px] md:h-11 bg-primary/70 shadow-black shadow-md backdrop-blur-sm text-primary-foreground text-[10px] md:text-sm font-mono font-black uppercase tracking-[0.2em] md:rotate-45 border-b-2 md:border-y-2 border-black pointer-events-auto select-none flex items-center justify-center text-center"
		>
			LAUNCHED on 21st June 2026
		</div>
	</div>

	<div
		class="absolute top-3 left-0 z-50 transition-transform duration-100 hover:scale-[1.02]"
	>
		<a href="https://hackclub.com/">
			<img
				class="w-24 md:w-40 bg-transparent p-1 rounded-md"
				src="https://assets.hackclub.com/banners/2026.svg"
				alt="Hack Club"
			/>
		</a>
	</div>
	<main class="z-10 relative w-full px-4 sm:px-6 md:px-10">
		<section
			class="flex flex-col justify-center min-h-screen pt-24 pb-12 gap-y-7 relative"
		>
			<div class="flex flex-col gap-2">
				<div
					class="flex items-center gap-2 text-xs font-bold text-primary tracking-[0.3em] uppercase"
				>
					<LoaderCircleIcon class="text-primary animate-spin h-3 w-3" />
					<span>Season 1</span>
				</div>
				<h1
					class="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-black font-alchemize tracking-tighter uppercase text-primary [text-shadow:4px_4px_0px_rgba(var(--primary),0.15)] selection:bg-white selection:text-black pointer-events-none select-none break-all sm:break-normal"
				>
					ALCHEMIZE
				</h1>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full lg:w-[60%]">
				<div class="max-w-full border-l-4 border-primary p-4 md:p-6 rounded-md">
					<p
						class="text-zinc-200 text-base md:text-xl leading-relaxed uppercase tracking-wide"
					>
						3 Themes | 3 Seasons <br />
						<strong
							class="text-white font-black text-lg md:text-2xl block mt-1 tracking-tight"
						>
							And a whole lot of mixing
						</strong>
					</p>
					<div
						class="inline-block mt-4 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest rounded-md"
					>
						Ages 13-18 Only
					</div>
				</div>
				<!-- <div
					class="flex flex-col gap-1 max-w-full bg-black/50 border border-zinc-800 p-4 rounded-md font-mono"
				>
					{#if timeLeft > 0}
						<div
							class="text-[10px] text-zinc-500 tracking-wider font-bold uppercase mb-1"
						>
							// TIME_REMAINING_UNTIL_LAUNCH
						</div>

						<div
							class="flex items-center gap-2 sm:gap-4 text-zinc-300 overflow-x-auto"
						>
							<div class="flex flex-col items-center">
								<span
									class="text-xl sm:text-2xl font-black text-primary font-mono"
									>{time.days}</span
								>
								<span class="text-[9px] uppercase tracking-widest text-zinc-500"
									>Days</span
								>
							</div>
							<span class="text-lg sm:text-xl text-zinc-700 font-black mb-4"
								>:</span
							>
							<div class="flex flex-col items-center">
								<span
									class="text-xl sm:text-2xl font-black text-zinc-100 font-mono"
									>{time.hours}</span
								>
								<span class="text-[9px] uppercase tracking-widest text-zinc-500"
									>Hrs</span
								>
							</div>
							<span class="text-lg sm:text-xl text-zinc-700 font-black mb-4"
								>:</span
							>
							<div class="flex flex-col items-center">
								<span
									class="text-xl sm:text-2xl font-black text-zinc-100 font-mono"
									>{time.minutes}</span
								>
								<span class="text-[9px] uppercase tracking-widest text-zinc-500"
									>Min</span
								>
							</div>
							<span class="text-lg sm:text-xl text-zinc-700 font-black mb-4"
								>:</span
							>
							<div class="flex flex-col items-center">
								<span
									class="text-xl sm:text-2xl font-black text-zinc-100 font-mono animate-pulse"
									>{time.seconds}</span
								>
								<span class="text-[9px] uppercase tracking-widest text-zinc-500"
									>Sec</span
								>
							</div>
						</div>

						<div
							class="mt-2 pt-2 border-t border-zinc-900/50 flex flex-col gap-0.5 text-[10px] uppercase font-bold tracking-wider text-zinc-400"
						>
							<div>
								<span class="text-zinc-600">LAUNCH_DATE:</span> JUNE 21, 2026
							</div>
							<div>
								<span class="text-zinc-600">TARGET_TIME:</span> 01:00 UTC
							</div>
						</div>
					{:else}
						<div
							class="text-2xl font-black text-primary uppercase tracking-wider flex flex-col items-center justify-center text-center gap-y-2"
						>
							ALCHEMIZE HAS STARTED!
							<img src="/Alchemize.png" alt="" class="h-20" />
						</div>
					{/if}
				</div> -->
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:w-[60%]">
				<a
					href={authUrl}
					class="group relative w-full"
					onclick={() => (showRotator = true)}
				>
					<div
						class="absolute inset-0 bg-primary translate-x-0.5 translate-y-0.5 rounded-md transition-transform group-hover:translate-x-0 group-hover:translate-y-0"
					></div>
					<div
						class="relative flex items-center justify-between border-2 border-primary bg-black text-primary text-xl font-black uppercase tracking-widest text-center px-4 md:px-6 py-3 rounded-md transition-transform"
					>
						<span>GET STARTED</span>
						{#if showRotator}
							<div
								class="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin"
							></div>
						{:else}
							<div class="flex gap-0.5 font-sans tracking-normal opacity-80">
								<ChevronsRight class="h-4 w-4" />
							</div>
						{/if}
					</div>
				</a>

				<div class="grid grid-cols-2 gap-x-2 w-full">
					<div class="group relative flex items-stretch">
						<a
							href="/docs"
							class="flex items-center justify-center gap-2 md:gap-3 w-full border-2 border-zinc-800 bg-black/60 hover:bg-zinc-900/60 text-zinc-300 hover:text-white font-bold uppercase tracking-wider px-3 md:px-6 py-3 rounded-md transition-all duration-100 shadow-[2px_2px_0px_0px_rgba(var(--primary),0.2)] text-lg md:text-lg"
						>
							<Newspaper class="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
							<span>Docs</span>
						</a>

						<div
							class="absolute top-full left-0 mt-2 hidden group-hover:block w-full z-50 bg-zinc-900 border-2 border-zinc-700 p-2 rounded-md text-xs text-zinc-300"
						>
							Read the docs here!
						</div>
					</div>
					<div class="group relative flex items-stretch">
						<a
							href="/shop"
							class="flex items-center justify-center gap-2 md:gap-3 w-full border-2 border-zinc-800 bg-black/60 hover:bg-zinc-900/60 text-zinc-300 hover:text-white font-bold uppercase tracking-wider px-3 md:px-6 py-3 rounded-md transition-all duration-100 shadow-[2px_2px_0px_0px_rgba(var(--primary),0.2)] text-lg md:text-lg"
						>
							<ShoppingBag
								class="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0"
							/>
							<span>Shop</span>
						</a>

						<div
							class="absolute top-full left-0 mt-2 hidden group-hover:block w-full z-50 bg-zinc-900 border-2 border-zinc-700 p-2 rounded-md text-xs text-zinc-300"
						>
							Take a look at the shop!
						</div>
					</div>
				</div>
			</div>

			<a
				href="#features"
				class="self-start animate-bounce mt-4 border border-zinc-800 p-2 hover:border-primary bg-black/40 transition-colors rounded-md"
			>
				<ArrowDown class="w-5 h-5 text-primary" />
			</a>
		</section>

		<section
			id="features"
			class="flex flex-col gap-12 py-24 border-t-2 border-zinc-900 relative"
		>
			<div class="flex flex-col gap-1">
				<div class="text-xs uppercase text-primary font-bold tracking-[0.25em]">
					Procedure
				</div>
				<h2
					class="text-3xl font-black font-alchemize tracking-tight uppercase text-white"
				>
					HOW IT WORKS
				</h2>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
				<div class="relative group">
					<div
						class="absolute inset-0 bg-primary/70 translate-x-0.5 translate-y-0.5 rounded-md"
					></div>
					<div
						class="relative h-full flex flex-row gap-4 bg-black border-2 border-primary group-hover:border-primary/80 p-5 rounded-md transition-transform hover:translate-x-0.5 hover:translate-y-0.5"
					>
						<div class="shrink-0 flex items-start pt-1">
							<div
								class="p-2 border border-primary bg-zinc-950/60 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors rounded-md"
							>
								<Blocks class="h-6 w-6" />
							</div>
						</div>
						<div class="flex flex-col gap-1">
							<h3
								class="text-lg font-black uppercase tracking-tight text-white"
							>
								01 - Create
							</h3>
							<p class="text-zinc-400 text-xs leading-relaxed">
								Pick a theme (Endless, No Internet, or Indie Gamedev) and track
								hours via Hackatime.
							</p>
						</div>
					</div>
				</div>

				<div class="relative group">
					<div
						class="absolute inset-0 bg-primary/70 translate-x-0.5 translate-y-0.5 rounded-md"
					></div>
					<div
						class="relative h-full flex flex-row gap-4 bg-black border-2 border-primary group-hover:border-primary/80 p-5 rounded-md transition-transform hover:translate-x-0.5 hover:translate-y-0.5"
					>
						<div class="shrink-0 flex items-start pt-1">
							<div
								class="p-2 border border-primary bg-zinc-950/60 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors rounded-md"
							>
								<Rocket class="h-6 w-6" />
							</div>
						</div>
						<div class="flex flex-col gap-1">
							<h3
								class="text-lg font-black uppercase tracking-tight text-white"
							>
								02 - Ship It
							</h3>
							<p class="text-zinc-400 text-xs leading-relaxed">
								Submit your project for review by the Alchinspectors to earn
								theme currency.
							</p>
						</div>
					</div>
				</div>

				<div class="relative group">
					<div
						class="absolute inset-0 bg-primary/70 translate-x-0.5 translate-y-0.5 rounded-md"
					></div>
					<div
						class="relative h-full flex flex-row gap-4 bg-black border-2 border-primary group-hover:border-primary/80 p-5 rounded-md transition-transform hover:translate-x-0.5 hover:translate-y-0.5"
					>
						<div class="shrink-0 flex items-start pt-1">
							<div
								class="p-2 border border-primary bg-zinc-950/60 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors rounded-md"
							>
								<FlaskConical class="h-6 w-6" />
							</div>
						</div>
						<div class="flex flex-col gap-1">
							<h3
								class="text-lg font-black uppercase tracking-tight text-white"
							>
								03 - Mix Potions
							</h3>
							<p class="text-zinc-400 text-xs leading-relaxed">
								Convert currencies into Potion Mix. Mixing multiple types grants
								bonuses.
							</p>
						</div>
					</div>
				</div>

				<div class="relative group">
					<div
						class="absolute inset-0 bg-primary/70 translate-x-0.5 translate-y-0.5 rounded-md"
					></div>
					<div
						class="relative h-full flex flex-row gap-4 bg-black border-2 border-primary group-hover:border-primary/80 p-5 rounded-md transition-transform hover:translate-x-0.5 hover:translate-y-0.5"
					>
						<div class="shrink-0 flex items-start pt-1">
							<div
								class="p-2 border border-primary bg-zinc-950/60 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors rounded-md"
							>
								<ShoppingCart class="h-6 w-6" />
							</div>
						</div>
						<div class="flex flex-col gap-1">
							<h3
								class="text-lg font-black uppercase tracking-tight text-white"
							>
								04 - Dynamic Shop
							</h3>
							<p class="text-zinc-400 text-xs leading-relaxed">
								Spend your Potion Mix on rewards. New items are added every
								season!
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>

		<section
			id="themes"
			class="flex flex-col gap-12 py-24 border-t-2 border-zinc-900 relative"
		>
			<div class="flex flex-col gap-1">
				<div class="text-xs uppercase text-primary font-bold tracking-[0.25em]">
					Themes
				</div>
				<h2
					class="text-3xl font-black font-alchemize tracking-tight uppercase text-white"
				>
					The Three Themes of Season 1
				</h2>
			</div>

			<div class="flex flex-col gap-4 w-full">
				<div class="relative group">
					<div
						class="absolute inset-0 bg-primary/80 translate-x-1.5 translate-y-1.5 rounded-md transition-transform group-hover:translate-x-1 group-hover:translate-y-1"
					></div>
					<div
						class="relative w-full flex flex-col md:flex-row bg-black/95 border-2 border-primary rounded-md p-5 gap-4 transition-transform hover:-translate-x-px hover:-translate-y-px"
					>
						<div
							class="w-full md:w-48 shrink-0 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-900 pb-3 md:pb-0 md:pr-4"
						>
							<div
								class="text-primary font-mono text-xs font-black uppercase tracking-widest mb-1"
							>
								THEME_01
							</div>
							<h3
								class="text-xl font-black uppercase tracking-tight text-white font-alchemize"
							>
								Endless
							</h3>
						</div>
						<div class="flex-1">
							<p class="text-zinc-300 text-xs leading-relaxed font-mono">
								Create a project with an infinite Canvas. It can be a game where
								levels generate endlessly(like pacman), It can be a paint app
								with infinite canvas, It can also be a scientific simulation
								which keeps on running indefinitely. It can be anything as long
								as it has an element of infinity to it(and it never ends).
							</p>
						</div>
					</div>
				</div>

				<div class="relative group">
					<div
						class="absolute inset-0 bg-primary/80 translate-x-1.5 translate-y-1.5 rounded-md transition-transform group-hover:translate-x-1 group-hover:translate-y-1"
					></div>
					<div
						class="relative w-full flex flex-col md:flex-row bg-black/95 border-2 border-primary rounded-md p-5 gap-4 transition-transform hover:-translate-x-px hover:-translate-y-px"
					>
						<div
							class="w-full md:w-48 shrink-0 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-900 pb-3 md:pb-0 md:pr-4"
						>
							<div
								class="text-primary font-mono text-xs font-black uppercase tracking-widest mb-1"
							>
								THEME_02
							</div>
							<h3
								class="text-xl font-black uppercase tracking-tight text-white font-alchemize"
							>
								No Internet
							</h3>
						</div>
						<div class="flex-1">
							<p class="text-zinc-300 text-xs leading-relaxed font-mono">
								Make something that works without an internet connection, No
								APIs, No CDNs, No fetching data from the internet, (and
								obviously no websites), it can be a game that doesn't require an
								internet connection, an app that uses Bluetooth to chat with
								friends, a robot that does something cool, anything as long as
								it works without internet.
							</p>
						</div>
					</div>
				</div>

				<div class="relative group">
					<div
						class="absolute inset-0 bg-primary/80 translate-x-1.5 translate-y-1.5 rounded-md transition-transform group-hover:translate-x-1 group-hover:translate-y-1"
					></div>
					<div
						class="relative w-full flex flex-col md:flex-row bg-black/95 border-2 border-primary rounded-md p-5 gap-4 transition-transform hover:-translate-x-px hover:-translate-y-px"
					>
						<div
							class="w-full md:w-48 shrink-0 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-900 pb-3 md:pb-0 md:pr-4"
						>
							<div
								class="text-primary font-mono text-xs font-black uppercase tracking-widest mb-1"
							>
								THEME_03
							</div>
							<h3
								class="text-xl font-black uppercase tracking-tight text-white font-alchemize"
							>
								Indie Gamedev
							</h3>
						</div>
						<div class="flex-1">
							<p class="text-zinc-300 text-xs leading-relaxed font-mono">
								Make a game inspired by the indie game genre. It can be a
								platformer with a unique art style, a narrative-driven
								experience, a puzzle game with innovative mechanics, or anything
								else that captures the spirit of indie games. Create your own
								artstyles here that gives vibes of indie pixel art, hand drawn
								aesthetics, The game should reflect the creativity and
								innovation that indie games are known for.
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>

		<section
			id="faq"
			class="flex flex-col gap-12 py-24 border-t-2 border-zinc-900 relative"
		>
			<div class="flex flex-col gap-1 items-center text-center">
				<div class="text-xs uppercase text-primary font-bold tracking-[0.25em]">
					Information
				</div>
				<h2
					class="text-3xl font-black font-alchemize tracking-tight uppercase text-white"
				>
					FAQ
				</h2>
			</div>

			<div class="flex flex-col gap-3 w-full max-w-4xl mx-auto">
				<Accordion
					Title="What is a 'ship'?"
					Content="A 'ship' is the project you submit to this event. You can ship any general project or a project related to one of the themes"
				/>
				<Accordion
					Title="Who is Eligible?"
					Content="Anyone ages 13-18 who isn't banned from Hack Club can participate."
				/>
				<Accordion
					Title="How is time tracked?"
					Content="Software development time is tracked using <a class='text-rose-400 p-1 hover:bg-rose-900/50 transition rounded hover:text-white' target='_blank' href='hackatime.hackclub.com'>Hackatime</a> and hardware time is tracked through <a class='text-rose-400 p-1 hover:bg-rose-900/50 transition rounded hover:text-white' target='_blank' href='lapse.hackclub.com'>Lapse</a>"
				/>
				<Accordion
					Title="Where can I find more information?"
					Content="If you have any questions or need help with anything, just join the <a class='text-rose-400 p-1 hover:bg-rose-900/50 transition rounded hover:text-white' target='_blank' href='https://hackclub.enterprise.slack.com/archives/C0ASY6R552R'>#alchemize-help</a> channel in the Hack Club Slack! You can ask for help there, and the community will be happy to assist you. "
				/>
			</div>
		</section>
	</main>

	<footer
		class="w-full border-t-2 border-zinc-950 bg-black/90 relative z-20 mt-24 py-16"
	>
		<div
			class="max-w-7xl mx-auto px-6 md:px-10 flex flex-col lg:flex-row gap-12 justify-between items-start"
		>
			<div class="flex flex-col gap-4 max-w-xs">
				<h3
					class="text-xl font-black font-alchemize text-primary tracking-wide uppercase"
				>
					Hack Club
				</h3>
				<p class="text-zinc-500 text-xs leading-relaxed">
					Hack Club is the world’s largest nonprofit movement of teenagers
					making cool projects.
				</p>
				<div class="text-zinc-600 text-[10px] mt-2 tracking-tight">
					© Hack Club • All Rights Reserved
				</div>
			</div>

			<div
				class="grid grid-cols-2 gap-x-16 gap-y-8 text-xs font-bold uppercase tracking-wider"
			>
				<div class="flex flex-col gap-3">
					<div class="text-zinc-500 text-[10px] font-mono tracking-widest">
						DIRECTORY
					</div>
					<a
						class="text-zinc-400 hover:text-primary transition-colors"
						href="https://hackclub.com/philosophy/">Philosophy</a
					>
					<a
						class="text-zinc-400 hover:text-primary transition-colors"
						href="https://hackclub.com/team/">Team Cluster</a
					>
					<a
						class="text-zinc-400 hover:text-primary transition-colors"
						href="https://hackclub.com/brand/">Asset Brand</a
					>
					<a
						class="text-zinc-400 hover:text-primary transition-colors"
						href="https://hackclub.com/philanthropy/">Liquidity Fund</a
					>
				</div>
				<div class="flex flex-col gap-3">
					<div class="text-zinc-500 text-[10px] font-mono tracking-widest">
						RESOURCES
					</div>
					<a
						class="text-zinc-400 hover:text-primary transition-colors"
						href="https://hackclub.com/jams/">System Jams</a
					>
					<a
						class="text-zinc-400 hover:text-primary transition-colors"
						href="https://toolbox.hackclub.com/">Toolbox Matrix</a
					>
					<a
						class="text-zinc-400 hover:text-primary transition-colors"
						href="https://hackclub.com/conduct/">Legal Conduct</a
					>
					<a
						class="text-zinc-400 hover:text-primary transition-colors"
						href="https://hackclub.com/privacy/">Data Privacy</a
					>
				</div>
			</div>

			<div
				class="border border-zinc-800 p-4 bg-zinc-950/60 max-w-xs lg:text-right flex flex-col gap-1 lg:items-end w-full sm:w-auto"
			>
				<div class="text-[10px] tracking-widest text-zinc-500 font-mono">
					// Credits
				</div>
				<div class="text-xs font-bold text-zinc-300">
					Made by TheUtkarsh8939
				</div>
				<div class="text-xs font-bold text-zinc-300">& Coolcream</div>
			</div>
		</div>
	</footer>
</div>

<style>
	main {
		transform: translateZ(0);
	}
</style>
