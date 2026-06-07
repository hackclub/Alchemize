<script lang="ts">
	import {
		ArrowDown,
		Blocks,
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

		const blob = document.getElementById("blob")
		let mouseX = 0
		let mouseY = 0
		let currentX = 0
		let currentY = 0

		const handleMouseMove = (event: MouseEvent) => {
			mouseX = event.clientX - 128
			mouseY = event.clientY - 128
		}

		const animateBlob = () => {
			currentX += (mouseX - currentX) * 0.08
			currentY += (mouseY - currentY) * 0.08

			if (blob instanceof HTMLElement) {
				blob.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`
			}

			requestAnimationFrame(animateBlob)
		}

		requestAnimationFrame(animateBlob)

		window.addEventListener("mousemove", handleMouseMove)
		return () => window.removeEventListener("mousemove", handleMouseMove)
	})
</script>

<div
	id="blob"
	class="z-20 fixed opacity-50 blur-[80px] size-64 pointer-events-none background-gradient"
></div>
<div
	class="relative bg-gradbg w-screen min-h-screen overflow-x-hidden bg-zinc-950 text-zinc-100"
>
	<div class="absolute inset-0 -z-10 bg-black/60"></div>

	<div class="streaks">
		<div class="streak streak-1"></div>
		<div class="streak streak-2"></div>
		<div class="streak streak-3"></div>
		<div class="streak streak-4"></div>
	</div>

	<main class="z-10 relative">
		<section
			class="flex flex-col justify-center pt-16 gap-y-11 px-[clamp(20px,3vw,64px)] min-h-screen relative"
		>
			<div
				class="flex items-center gap-x-4 justify-self-start absolute top-0 left-10"
			>
				<a href="https://hackclub.com/"
					><img
						class="border-0 w-28 z-999"
						src="https://assets.hackclub.com/flag-orpheus-top.svg"
						alt="Hack Club"
					/></a
				>
				<X class="font-bold h-7 w-7 text-rose-500" />
				<img src="/Alchemist.webp" alt="" class="w-10 h-10" />
				<span
					class="font-hero font-bold tracking-widest text-lg text-rose-500 select-none pointer-events-none"
				>
					ALCHEMIZE
				</span>
			</div>

			<h1
				class="font-hero hero-title text-rose-600 drop-shadow-[0_4px_12px_rgba(225,29,72,0.3)]"
			>
				ALCHEMIZE
			</h1>

			<p
				class="text-rose-200/90 text-[clamp(1rem,5.5vw,1.5rem)] leading-relaxed"
			>
				Turn your code into prizes.<br />
				<strong class="text-white text-[clamp(1rem,6.5vw,1.75rem)]"
					>And you're invited.</strong
				>
				<br />
				<span class="opacity-70 text-lg text-rose-300/80">Ages 13-18</span>
			</p>

			<div class="flex items-center gap-x-2">
				<a
					href={authUrl}
					class="cta-btn bg-rose-600 hover:bg-rose-700 text-white transition-colors"
					onclick={() => (showRotator = true)}
				>
					<span class="cta-text">GET STARTED</span>
					{#if showRotator}
						<div
							class="w-7 h-7 border-4 border-rose-950 border-t-white rounded-full animate-spin"
						></div>
					{:else}
						<div class="cta-chevrons text-rose-200">
							<span>›</span><span>›</span><span>›</span>
						</div>
					{/if}
				</a>
				<div class="group flex h-full items-center gap-x-3">
					<a
						href={referUrl}
						class="refer-btn border border-rose-800/60 hover:bg-rose-950/40 transition-colors"
					>
						<Users class="h-7 w-7" />
						<p class="text-rose-300">Refer!</p>
					</a>
					<p
						class="group-hover:opacity-100 opacity-0 transition animate-out text-sm bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl text-zinc-300"
					>
						Refer more people for cool rewards!
					</p>
				</div>
			</div>

			<div class="flex flex-col gap-2 w-[clamp(120px,50vw,384px)]">
				<div
					class="bg-zinc-900 border border-rose-950 rounded-full w-full h-3 overflow-hidden"
				>
					<div
						class="bg-rose-600 h-full transition-all duration-1000 shadow-[0_0_12px_rgba(225,29,72,0.6)]"
						style="width: {((typeof rsvpCount === 'string' ? 289 : rsvpCount) /
							210) *
							100}%"
					></div>
				</div>
				<p class="text-rose-300/60 text-sm">
					{rsvpCount} / ??? RSVPs so far
				</p>
			</div>

			<a href="#features" class="self-start animate-bounce">
				<ArrowDown class="w-8 h-8 text-rose-500" />
			</a>
		</section>

		<div class="w-full leading-none relative z-0">
			<svg
				viewBox="0 0 1440 100"
				preserveAspectRatio="none"
				class="w-full h-24"
			>
				<path
					d="M0,40 C200,90 400,10 600,50 C800,90 1000,20 1200,60 C1440,85 1440,55 1440,55 L1440,100 L0,100 Z"
					class="fill-rose-950/40"
				/>
				<path
					d="M0,60 C150,30 350,80 550,45 C750,10 950,70 1150,40 C1400,20 1440,50 1440,50 L1440,100 L0,100 Z"
					class="fill-rose-950/20"
					opacity="0.6"
				/>
			</svg>
		</div>

		<section
			id="features"
			class="flex flex-col items-center gap-16 bg-gradient-to-b from-rose-950/40 to-zinc-950 px-16 py-24"
		>
			<h2
				class="font-hero text-center section-title text-3xl text-rose-100"
			>
				HOW IT WORKS
			</h2>

			<div class="gap-6 grid grid-cols-1 md:grid-cols-2 w-full max-w-5xl">
				<div
					class="feature-card bg-zinc-900/50 border border-rose-950/50 p-6 rounded-xl"
				>
					<Blocks class="h-8 w-8 mb-1 text-rose-400" />
					<h3 class="font-hero text-rose-300 text-xl">Create</h3>
					<p class="text-zinc-400 text-sm leading-relaxed">
						Pick a theme (Sci-Fi, Anime, or Tribute) and track hours via
						Hackatime.
					</p>
				</div>
				<div
					class="feature-card bg-zinc-900/50 border border-rose-950/50 p-6 rounded-xl"
				>
					<Rocket class="h-8 w-8 mb-1 text-rose-400" />
					<h3 class="font-hero text-rose-300 text-xl">Ship It</h3>
					<p class="text-zinc-400 text-sm leading-relaxed">
						Submit your project for review by Master Alchistants to earn theme
						currency.
					</p>
				</div>
				<div
					class="feature-card bg-zinc-900/50 border border-rose-950/50 p-6 rounded-xl"
				>
					<FlaskConical class="h-8 w-8 mb-1 text-rose-400" />
					<h3 class="font-hero text-rose-300 text-xl">Mix Potions</h3>
					<p class="text-zinc-400 text-sm leading-relaxed">
						Convert currencies into Potion Mix. Mixing multiple types grants
						bonuses.
					</p>
				</div>
				<div
					class="feature-card bg-zinc-900/50 border border-rose-950/50 p-6 rounded-xl"
				>
					<ShoppingCart class="h-8 w-8 mb-1 text-rose-400" />
					<h3 class="font-hero text-rose-300 text-xl">Dynamic Shop</h3>
					<p class="text-zinc-400 text-sm leading-relaxed">
						Spend your Potion Mix on rewards. New items are added weekly based
						on your suggestions!
					</p>
				</div>
			</div>
		</section>

		<section
			id="themes"
			class="flex flex-col items-center gap-16 bg-zinc-950 px-16 pt-12 pb-95 h-auto"
		>
			<h2
				class="font-hero text-center section-title text-2xl text-rose-100"
			>
				The Three Themes of Season 1
			</h2>

			<div class="gap-6 grid grid-cols-1 md:grid-cols-3 w-full max-w-5xl">
				<div
					class="feature-card bg-zinc-900/40 border border-rose-950/30 p-6 rounded-xl"
				>
					<h3 class="font-hero text-rose-300 text-xl">Endless</h3>
					<p class="text-zinc-400 text-sm leading-relaxed">
						Create a project with an infinite Canvas. It can be a game where
						levels generate endlessly(like pacman), It can be a paint app with
						infinite canvas, It can also be a scientific simulation which keeps
						on running indefinitely. It can be anything as long as it has an
						element of infinity to it(and it never ends).
					</p>
				</div>
				<div
					class="feature-card bg-zinc-900/40 border border-rose-950/30 p-6 rounded-xl"
				>
					<h3 class="font-hero text-rose-300 text-xl">No Internet</h3>
					<p class="text-zinc-400 text-sm leading-relaxed">
						Make something that works without an internet connection, No APIs,
						No CDNs, No fetching data from the internet, (and obviously no
						websites), it can be a game that doesn't require an internet
						connection, an app that uses Bluetooth to chat with friends, a robot
						that does something cool, anything as long as it works without
						internet.
					</p>
				</div>
				<div
					class="feature-card bg-zinc-900/40 border border-rose-950/30 p-6 rounded-xl"
				>
					<h3 class="font-hero text-rose-300 text-xl">Indie Gamedev</h3>
					<p class="text-zinc-400 text-sm leading-relaxed">
						Make a game inspired by the indie game genre. It can be a platformer
						with a unique art style, a narrative-driven experience, a puzzle
						game with innovative mechanics, or anything else that captures the
						spirit of indie games. Create your own artstyles here that gives vibes of indie
						pixel art, hand drawn aesthetics,   The game should reflect the
						creativity and innovation that indie games are known for.
					</p>
				</div>
			</div>
		</section>

		<div class="w-screen leading-none -mt-[20vw]">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
				<path
					class="fill-rose-950/60"
					fill-opacity="1"
					d="M0,160L30,170.7C60,181,120,203,180,224C240,245,300,267,360,277.3C420,288,480,288,540,277.3C600,267,660,245,720,218.7C780,192,840,160,900,160C960,160,1020,192,1080,208C1140,224,1200,224,1260,197.3C1320,171,1380,117,1410,90.7L1440,64L1440,320L1410,320C1380,320,1320,320,1260,320C1200,320,1140,320,1080,320C1020,320,960,320,900,320C840,320,780,320,720,320C660,320,600,320,540,320C480,320,420,320,360,320C300,320,240,320,180,320C120,320,60,320,30,320L0,320Z"
				></path>
			</svg>
		</div>

		<section
			id="faq"
			class="flex flex-col items-center gap-6 px-16 py-24 min-auto pb-75 h-auto bg-gradient-to-b from-rose-950/60 to-zinc-950 -mt-1"
		>
			<h2
				class="font-hero text-center section-title text-3xl text-rose-100"
			>
				FAQ
			</h2>
			<Accordion
				Title="What is a 'ship'?"
				Content="A 'ship' is the project you submit to this event. You can ship any general project or a project related to one of the <a class='text-rose-400 p-1 hover:bg-rose-900/50 transition rounded hover:text-white' href='#themes'>themes</a>"
				addClass="faq-item h-20 w-[clamp(120px,90vw,1084px)] font-sans relative z-10 border border-rose-950/40 rounded-xl bg-zinc-900/20"
			/>
			<Accordion
				Title="How do I participate?"
				Content="Just Click on Get Started button on the home page or click on <a class='text-rose-400 p-1 hover:bg-rose-900/50 transition rounded hover:text-white' target='_blank' href={authUrl}>this</a> link."
				addClass="faq-item h-20 w-[clamp(120px,90vw,1084px)] font-sans relative z-10 border border-rose-950/40 rounded-xl bg-zinc-900/20"
			/>
			<Accordion
				Title="Who is Eligible?"
				Content="Anyone ages 13-18 who isn't banned from Hack Club can participate."
				addClass="faq-item h-20 w-[clamp(120px,90vw,1084px)] font-sans relative z-10 border border-rose-950/40 rounded-xl bg-zinc-900/20"
			/>
			<Accordion
				Title="How is time tracked?"
				Content="Software development time is tracked using <a class='text-rose-400 p-1 hover:bg-rose-900/50 transition rounded hover:text-white' target='_blank' href='hackatime.hackclub.com'>Hackatime</a>"
				addClass="faq-item h-20 w-[clamp(120px,90vw,1084px)] font-sans relative z-10 border border-rose-950/40 rounded-xl bg-zinc-900/20"
			/>
			<Accordion
				Title="What is Hack Club?"
				Content="Hack Club is a community of creative coders who love to build and share their projects. It is also the world’s largest nonprofit movement of teenagers making cool projects."
				addClass="faq-item h-20 w-[clamp(120px,90vw,1084px)] font-sans relative z-10 border border-rose-950/40 rounded-xl bg-zinc-900/20"
			/>
			<Accordion
				Title="Where can I find more information?"
				Content="If you have any questions or need help with anything, just join the <a class='text-rose-400 p-1 hover:bg-rose-900/50 transition rounded hover:text-white' target='_blank' href='https://hackclub.enterprise.slack.com/archives/C0ASY6R552R'>#alchemize-help</a> channel in the Hack Club Slack! You can ask for help there, and the community will be happy to assist you. "
				addClass="faq-item h-20 w-[clamp(120px,90vw,1084px)] font-sans relative z-10 border border-rose-950/40 rounded-xl bg-zinc-900/20"
			/>
		</section>

		<div class="w-screen leading-none -mt-[30vw] z-10 h-auto">
			<svg
				width="100%"
				height="100%"
				id="svg"
				viewBox="0 0 1440 470"
				xmlns="http://www.w3.org/2000/svg"
				class="transition duration-300 ease-in-out delay-150"
			>
				<path
					d="M 0,600 L 0,350 C 163.46666666666664,318.4 326.9333333333333,286.8 498,287 C 669.0666666666667,287.2 847.7333333333333,319.2 1006,335 C 1164.2666666666667,350.8 1302.1333333333332,350.4 1440,350 L 1440,600 L 0,600 Z"
					stroke="none"
					stroke-width="0"
					class="fill-zinc-950 transition-all duration-300 ease-in-out delay-150 path-1"
				></path>
			</svg>
			<footer
				class="w-full px-20 absolute items-center flex bg-zinc-950 border-t border-rose-950/30 pt-10 pb-10 gap-16 justify-around text-zinc-400 text-sm"
			>
				<div class="row1 flex flex-col gap-5 w-33">
					<h3 class="text-3xl font-semibold font-hero text-rose-500">
						Hackclub
					</h3>
					<ul class="flex list-none flex-col gap-4">
						<li>
							<a
								class="hover:text-rose-400 transition-colors"
								href="https://hackclub.com/philosophy/">Philosophy</a
							>
						</li>
						<li>
							<a
								class="hover:text-rose-400 transition-colors"
								href="https://hackclub.com/team/">Team and Board</a
							>
						</li>
						<li>
							<a
								class="hover:text-rose-400 transition-colors"
								href="https://hackclub.com/brand/">Brand Guide</a
							>
						</li>
						<li>
							<a
								class="hover:text-rose-400 transition-colors"
								href="https://hackclub.com/philanthropy/">Donate</a
							>
						</li>
						<li>
							<a
								class="hover:text-rose-400 transition-colors"
								href="https://hackclub.com/imprint/">Imprint</a
							>
						</li>
					</ul>
				</div>
				<div class="midrow flex flex-col gap-2 text-center">
					<h2 class="text-zinc-300">
						Made with 💖 by TheUtkarsh8939 and Coolcream
					</h2>
					<h2 class="text-zinc-500 text-xs">
						© Hackclub, All rights reserved
					</h2>
				</div>
				<div class="row2 flex flex-col gap-5 w-43">
					<h3 class="text-3xl font-semibold font-hero text-rose-500">
						Resources
					</h3>
					<ul class="flex list-none flex-col gap-4">
						<li>
							<a
								class="hover:text-rose-400 transition-colors"
								href="https://hackclub.com/philosophy/">Community Events</a
							>
						</li>
						<li>
							<a
								class="hover:text-rose-400 transition-colors"
								href="https://hackclub.com/team/">Jams</a
							>
						</li>
						<li>
							<a
								class="hover:text-rose-400 transition-colors"
								href="https://hackclub.com/https://toolbox.hackclub.com/"
								>Toolbox
							</a>
						</li>
						<li>
							<a
								class="hover:text-rose-400 transition-colors"
								href="https://hackclub.com/conduct/">Code of Conduct</a
							>
						</li>
						<li>
							<a
								class="hover:text-rose-400 transition-colors"
								href="https://hackclub.com/privacy/">Privacy Policy</a
							>
						</li>
					</ul>
				</div>
			</footer>
		</div>
	</main>
</div>

<style>
	@import url("https://fonts.googleapis.com/css2?family=Shantell+Sans:ital,wght@0,300..800;1,300..800&display=swap");

	main {
		transform: translateZ(0);
	}

	section {
		will-change: transform;
	}

	.background-gradient {
		position: fixed;
		background: linear-gradient(45deg, #4c0519, #9f1239);
		filter: blur(150px);
		border-radius: 50%;
		will-change: transform;
	}

	.streaks {
		position: absolute;
		top: 0;
		right: 0;
		width: 50vw;
		height: 35vh;
		pointer-events: none;
		z-index: 0;
		overflow: hidden;
	}
	.streak {
		position: absolute;
		right: -10%;
		border-radius: 999px;
		transform: rotate(-8deg);
		transform-origin: right center;
	}
	.streak-1 {
		width: 80%;
		top: 6%;
		height: 16px;
		background: #4c0519;
		animation: streak-in 0.6s ease 0.1s both;
	}
	.streak-2 {
		width: 65%;
		top: 13%;
		height: 12px;
		background: #881337;
		animation: streak-in 0.6s ease 0.2s both;
	}
	.streak-3 {
		width: 50%;
		top: 19%;
		height: 8px;
		background: #9f1239;
		animation: streak-in 0.6s ease 0.3s both;
	}
	.streak-4 {
		width: 35%;
		top: 24%;
		height: 5px;
		background: #be123c;
		animation: streak-in 0.6s ease 0.4s both;
	}

	@keyframes streak-in {
		from {
			opacity: 0;
			transform: rotate(-8deg) translateX(100px);
		}
		to {
			opacity: 1;
			transform: rotate(-8deg) translateX(0);
		}
	}

	.hero-title {
		font-size: clamp(2rem, 12vw, 10rem);
		line-height: 1;
		pointer-events: none;
		user-select: none;
		color: var(--color-primary);
		-webkit-text-stroke: 4px var(--color-primary);
		text-shadow: 3px 3px 4px rgb(255, 186, 206);
	}

	.cta-btn {
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: 400px;
		width: 50vw;

		background: var(--color-primary);
		border: 3px solid #7f1d1d;
		border-radius: 1rem;
		padding: 1.2rem 2rem;
		text-decoration: none;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	svg {
		display: block;
	}

	.refer-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		width: 7vw;
		/* min-height: 11vh; */
		padding: 10px 0px;

		background: var(--color-primary);
		border: 3px solid #7f1d1d;
		border-radius: 1rem;
		text-decoration: none;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.cta-btn:hover,
	.refer-btn:hover {
		transform: scale(1.02);
		box-shadow: 0 0 40px rgba(185, 28, 28, 0.5);
	}

	.cta-text {
		font-family: var(--font-hero);
		font-size: clamp(1rem, 4vw, 1.5rem);
		font-weight: 900;
		color: white;
	}

	.feature-card {
		background: rgba(255, 255, 255, 0.03);
		border: 1px dashed #7f1d1d;
		border-radius: 1rem;
		padding: 2rem;
		transition: background 0.2s ease;
	}

	.feature-card:hover {
		background: rgba(127, 29, 29, 0.15);
	}
	
</style>
