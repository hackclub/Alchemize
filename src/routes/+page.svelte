<script lang="ts">
	import {
		ArrowDown,
		Blocks,
		ChevronsRight,
		FlaskConical,
		Rocket,
		ShoppingCart,
		Users,
		X,
	} from "lucide-svelte"
	import { onMount } from "svelte"
	import { browser } from "$app/environment"
	import {
		PUBLIC_HACKCLUB_AUTH,
		PUBLIC_HACKCLUB_REDIRECT,
	} from "$env/static/public"
	import Accordion from "$lib/components/accordion.svelte"
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
		hasaccessToken
			? `./dashboard`
			: `https://auth.hackclub.com/oauth/authorize?client_id=${clientId}&response_type=code&scope=openid+profile+email+name+verification_status+slack_id&redirect_uri=${uri}`
	)
	let referUrl = $state(`./refer`)

	onMount(() => {
		if (data.error) {
			alert(data.error)
		}
		hasaccessToken =
			document.cookie.split("; ").find(row => row.startsWith("slack_id=")) !==
			undefined

		authUrl = hasaccessToken
			? `./dashboard`
			: `https://auth.hackclub.com/oauth/authorize?client_id=${clientId}&response_type=code&scope=openid+profile+email+name+verification_status+slack_id&redirect_uri=${uri}`
		fetch("/rsvp")
			.then(res => res.json())
			.then(data => (rsvpCount = data.count))

		referUrl = hasaccessToken
			? `./refer`
			: `https://auth.hackclub.com/oauth/authorize?client_id=${clientId}&response_type=code&scope=openid+profile+email+name+verification_status+slack_id&redirect_uri=${uri}`
		fetch("/rsvp")
			.then(res => res.json())
			.then(data => (rsvpCount = data.count))
	})
</script>

<div
	class="relative min-h-screen w-full bg-gradbg text-zinc-100 font-mono tracking-wide selection:bg-primary selection:text-primary-foreground overflow-x-hidden"
>
	<div class="fixed inset-0 bg-black/25 z-0 pointer-events-none"></div>

	<div
		class="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-80"
	></div>

	<div
		class="absolute top-3 left-0 z-50 transition-transform duration-100 hover:scale-[1.02]"
	>
		<a href="https://hackclub.com/" class="">
			<img
				class="w-40 backdrop-blur-sm p-1 rounded-none"
				src="https://assets.hackclub.com/banners/2026.svg"
				alt="Hack Club"
			/>
		</a>
	</div>
	<main class="z-10 relative w-full px-6 md:px-10">
		<section
			class="flex flex-col justify-center min-h-screen pt-24 pb-12 gap-y-7 relative"
		>
			<div class="flex flex-col gap-2">
				<div
					class="flex items-center gap-2 text-xs font-bold text-primary tracking-[0.3em] uppercase"
				>
					<span class="h-2 w-2 bg-primary animate-pulse"></span>
					<span>Season 1</span>
				</div>
				<h1
					class="text-6xl md:text-8xl lg:text-9xl font-black font-alchemize tracking-tighter uppercase text-primary [text-shadow:4px_4px_0px_rgba(var(--primary),0.15)] selection:bg-white selection:text-black pointer-events-none select-none"
				>
					ALCHEMIZE
				</h1>
			</div>

			<div class="max-w-2xl border-l-4 border-primary p-4 md:p-6 rounded-none">
				<p
					class="text-zinc-200 text-base md:text-xl leading-relaxed uppercase tracking-wide"
				>
					Turn your code into prizes.<br />
					<strong
						class="text-white font-black text-lg md:text-2xl block mt-1 tracking-tight"
						>And you're invited.</strong
					>
				</p>
				<div
					class="inline-block mt-4 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest rounded-none"
				>
					Ages 13-18 Only
				</div>
			</div>

			<div
				class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-2xl"
			>
				<a
					href={authUrl}
					class="group relative flex-1"
					onclick={() => (showRotator = true)}
				>
					<div
						class="absolute inset-0 bg-primary translate-x-1 translate-y-1 rounded-none transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5"
					></div>
					<div
						class="relative flex items-center justify-between border-2 border-primary bg-black text-primary font-black uppercase tracking-widest text-center px-6 py-4 rounded-none transition-transform group-hover:-translate-x-px group-hover:-translate-y-px"
					>
						<span>GET STARTED</span>
						{#if showRotator}
							<div
								class="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin"
							></div>
						{:else}
							<div
								class="flex gap-0.5 font-sans tracking-normal opacity-80 group-hover:translate-x-1 transition-transform"
							>
								<ChevronsRight class="h-4 w-4" />
							</div>
						{/if}
					</div>
				</a>

				<div class="group relative flex-1 flex items-stretch">
					<a
						href={referUrl}
						class="flex items-center justify-center gap-3 w-full border-2 border-zinc-800 bg-black/60 hover:bg-zinc-900/60 text-zinc-300 hover:text-white font-bold uppercase tracking-wider px-6 py-4 rounded-none transition-all duration-100 shadow-[2px_2px_0px_0px_rgba(var(--primary),0.2)]"
					>
						<Users class="h-5 w-5 text-primary" />
						<span>Refer People!</span>
					</a>

					<div
						class="absolute bottom-full left-0 mb-2 hidden group-hover:block w-full z-50 bg-zinc-900 border-2 border-zinc-700 p-3 rounded-none text-xs text-zinc-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
					>
						Propagate your personal invite matrix endpoint link to unlock
						exclusive tiers!
					</div>
				</div>
			</div>

			<div
				class="flex flex-col gap-2 max-w-sm bg-black/50 border border-zinc-800 p-4 rounded-none"
			>
				<div
					class="flex justify-between items-center text-xs uppercase font-bold tracking-widest text-zinc-400"
				>
					<span>RSVP Count</span>
					<span class="text-primary font-mono font-black"
						>{rsvpCount} / ???RSVPs</span
					>
				</div>
				<div
					class="bg-zinc-950 border border-zinc-800 rounded-none w-full h-4 p-0.5 overflow-hidden"
				>
					<div
						class="bg-primary h-full transition-all duration-1000 relative shadow-[0_0_10px_rgba(var(--primary),0.4)]"
						style="width: {((typeof rsvpCount === 'string' ? 289 : rsvpCount) /
							210) *
							100}%"
					>
						<div
							class="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[size:8px_8px] animate-pulse"
						></div>
					</div>
				</div>
			</div>

			<a
				href="#features"
				class="self-start animate-bounce mt-4 border border-zinc-800 p-2 hover:border-primary bg-black/40 transition-colors"
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
						class="absolute inset-0 bg-primary/70 translate-x-1 translate-y-1 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5"
					></div>
					<div
						class="relative h-full flex flex-row gap-4 bg-black border-2 border-zinc-800 group-hover:border-primary/80 p-5 rounded-none transition-transform hover:-translate-x-px hover:-translate-y-px"
					>
						<div class="shrink-0 flex items-start pt-1">
							<div
								class="p-2 border border-zinc-800 bg-zinc-950/60 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
							>
								<Blocks class="h-6 w-6" />
							</div>
						</div>
						<div class="flex flex-col gap-1">
							<h3
								class="text-lg font-black uppercase tracking-tight text-white"
							>
								01 / Create
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
						class="absolute inset-0 bg-primary/70 translate-x-1 translate-y-1 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5"
					></div>
					<div
						class="relative h-full flex flex-row gap-4 bg-black border-2 border-zinc-800 group-hover:border-primary/80 p-5 rounded-none transition-transform hover:-translate-x-px hover:-translate-y-px"
					>
						<div class="shrink-0 flex items-start pt-1">
							<div
								class="p-2 border border-zinc-800 bg-zinc-950/60 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
							>
								<Rocket class="h-6 w-6" />
							</div>
						</div>
						<div class="flex flex-col gap-1">
							<h3
								class="text-lg font-black uppercase tracking-tight text-white"
							>
								02 / Ship It
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
						class="absolute inset-0 bg-primary/70 translate-x-1 translate-y-1 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5"
					></div>
					<div
						class="relative h-full flex flex-row gap-4 bg-black border-2 border-zinc-800 group-hover:border-primary/80 p-5 rounded-none transition-transform hover:-translate-x-px hover:-translate-y-px"
					>
						<div class="shrink-0 flex items-start pt-1">
							<div
								class="p-2 border border-zinc-800 bg-zinc-950/60 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
							>
								<FlaskConical class="h-6 w-6" />
							</div>
						</div>
						<div class="flex flex-col gap-1">
							<h3
								class="text-lg font-black uppercase tracking-tight text-white"
							>
								03 / Mix Potions
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
						class="absolute inset-0 bg-primary/70 translate-x-1 translate-y-1 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5"
					></div>
					<div
						class="relative h-full flex flex-row gap-4 bg-black border-2 border-zinc-800 group-hover:border-primary/80 p-5 rounded-none transition-transform hover:-translate-x-px hover:-translate-y-px"
					>
						<div class="shrink-0 flex items-start pt-1">
							<div
								class="p-2 border border-zinc-800 bg-zinc-950/60 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
							>
								<ShoppingCart class="h-6 w-6" />
							</div>
						</div>
						<div class="flex flex-col gap-1">
							<h3
								class="text-lg font-black uppercase tracking-tight text-white"
							>
								04 / Dynamic Shop
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
						class="absolute inset-0 bg-primary/80 translate-x-1.5 translate-y-1.5 rounded-none transition-transform group-hover:translate-x-1 group-hover:translate-y-1"
					></div>
					<div
						class="relative w-full flex flex-col md:flex-row bg-black/95 border-2 border-zinc-800 group-hover:border-primary/80 rounded-none p-5 gap-4 transition-transform hover:-translate-x-px hover:-translate-y-px"
					>
						<div
							class="w-full md:w-48 shrink-0 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-900 pb-3 md:pb-0 md:pr-4"
						>
							<div
								class="text-primary font-mono text-xs font-black uppercase tracking-widest mb-1"
							>
								// THEME_01
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
						class="absolute inset-0 bg-primary/80 translate-x-1.5 translate-y-1.5 rounded-none transition-transform group-hover:translate-x-1 group-hover:translate-y-1"
					></div>
					<div
						class="relative w-full flex flex-col md:flex-row bg-black/95 border-2 border-zinc-800 group-hover:border-primary/80 rounded-none p-5 gap-4 transition-transform hover:-translate-x-px hover:-translate-y-px"
					>
						<div
							class="w-full md:w-48 shrink-0 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-900 pb-3 md:pb-0 md:pr-4"
						>
							<div
								class="text-primary font-mono text-xs font-black uppercase tracking-widest mb-1"
							>
								// THEME_02
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
						class="absolute inset-0 bg-primary/80 translate-x-1.5 translate-y-1.5 rounded-none transition-transform group-hover:translate-x-1 group-hover:translate-y-1"
					></div>
					<div
						class="relative w-full flex flex-col md:flex-row bg-black/95 border-2 border-zinc-800 group-hover:border-primary/80 rounded-none p-5 gap-4 transition-transform hover:-translate-x-px hover:-translate-y-px"
					>
						<div
							class="w-full md:w-48 shrink-0 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-900 pb-3 md:pb-0 md:pr-4"
						>
							<div
								class="text-primary font-mono text-xs font-black uppercase tracking-widest mb-1"
							>
								// THEME_03
							</div>
							<h3
								class="text-xl font-black uppercase tracking-tight text-white font-alchemize"
							>
								Indie Game
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
					addClass="faq-item h-auto w-full font-mono relative z-10 border-2 border-zinc-800 bg-black text-zinc-300 text-xs p-1 rounded-none hover:border-primary/50 transition-colors"
				/>
				<Accordion
					Title="How do I participate?"
					Content="Just Click on Get Started button on the home page or click on <a class='text-rose-400 p-1 hover:bg-rose-900/50 transition rounded hover:text-white' target='_blank' href={authUrl}>this</a> link."
					addClass="faq-item h-auto w-full font-mono relative z-10 border-2 border-zinc-800 bg-black text-zinc-300 text-xs p-1 rounded-none hover:border-primary/50 transition-colors"
				/>
				<Accordion
					Title="Who is Eligible?"
					Content="Anyone ages 13-18 who isn't banned from Hack Club can participate."
					addClass="faq-item h-auto w-full font-mono relative z-10 border-2 border-zinc-800 bg-black text-zinc-300 text-xs p-1 rounded-none hover:border-primary/50 transition-colors"
				/>
				<Accordion
					Title="How is time tracked?"
					Content="Software development time is tracked using <a class='text-rose-400 p-1 hover:bg-rose-900/50 transition rounded hover:text-white' target='_blank' href='hackatime.hackclub.com'>Hackatime</a> and hardware time is tracked through <a class='text-rose-400 p-1 hover:bg-rose-900/50 transition rounded hover:text-white' target='_blank' href='lapse.hackclub.com'>Lapse</a>"
					addClass="faq-item h-auto w-full font-mono relative z-10 border-2 border-zinc-800 bg-black text-zinc-300 text-xs p-1 rounded-none hover:border-primary/50 transition-colors"
				/>
				<Accordion
					Title="Where can I find more information?"
					Content="If you have any questions or need help with anything, just join the <a class='text-rose-400 p-1 hover:bg-rose-900/50 transition rounded hover:text-white' target='_blank' href='https://hackclub.enterprise.slack.com/archives/C0ASY6R552R'>#alchemize-help</a> channel in the Hack Club Slack! You can ask for help there, and the community will be happy to assist you. "
					addClass="faq-item h-auto w-full font-mono relative z-10 border-2 border-zinc-800 bg-black text-zinc-300 text-xs p-1 rounded-none hover:border-primary/50 transition-colors"
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
						// DIRECTORY
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
						// RESOURCES
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
				class="border border-zinc-800 p-4 bg-zinc-950/60 max-w-xs lg:text-right flex flex-col gap-1 lg:items-end"
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
