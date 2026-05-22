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
	let referUrl = $derived(
		hasaccessToken
			? `./refer`
			: `https://auth.hackclub.com/oauth/authorize?client_id=${clientId}&response_type=code&scope=openid+profile+email+name+verification_status+slack_id&redirect_uri=${uri}`
	)
	onMount(() => {
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
		const handleMouseMove = (event: MouseEvent) => {
			blob?.animate(
				{
					top: `${event.clientY - 128}px`,
					left: `${event.clientX - 128}px`,
				},
				{ duration: 700, fill: "forwards" }
			)
		}

		window.addEventListener("mousemove", handleMouseMove)
		return () => window.removeEventListener("mousemove", handleMouseMove)
	})
</script>

<div
	id="blob"
	class="z-20 fixed opacity-50 blur-[180px] size-64 pointer-events-none background-gradient"
></div>
<div class="relative bg-gradbg w-screen min-h-screen overflow-x-hidden">
	<div class="top-0 left-0 -z-10 fixed bg-black/70 w-full h-full"></div>

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
				<X class="font-bold h-7 w-7" />
				<img src="/Alchemist.webp" alt="" class="w-10 h-10" />
				<span
					class="font-alchemize font-bold tracking-widest text-lg text-primary select-none pointer-events-none"
				>
					ALCHEMIZE
				</span>
			</div>

			<h1 class="font-alchemize hero-title">ALCHEMIZE</h1>

			<p
				class="text-red-200/80 text-[clamp(1rem,5.5vw,1.5rem)] leading-relaxed"
			>
				Turn your code into prizes.<br />
				<strong class="text-white text-[clamp(1rem,6.5vw,1.75rem)]"
					>And you're invited.</strong
				>
				<br />
				<span class="opacity-70 text-lg">Ages 13-18</span>
			</p>

			<div class="flex items-center gap-x-2">
				<a href={authUrl} class="cta-btn" onclick={() => (showRotator = true)}>
					<span class="cta-text">GET STARTED</span>
					{#if showRotator}
						<div
							class="w-7 h-7 border-4 border-gray-500 border-t-white rounded-full animate-spin"
						></div>
					{:else}
						<div class="cta-chevrons">
							<span>›</span><span>›</span><span>›</span>
						</div>
					{/if}
				</a>
				<!-- MAKE THIS DIV BELoW APPEAR ONLy FOR LOGGED IN USERS VERY IMP. -->
				<div class="group flex h-full items-center gap-x-3">
					<a href={referUrl} class="refer-btn">
						<Users class="h-7 w-7" />
						<p>Refer!</p>
					</a>
					<p
						class="group-hover:opacity-100 opacity-0 transition animate-out text-sm bg-background/60 p-3 rounded-2xl"
					>
						Refer more people for cool rewards!
					</p>
				</div>
			</div>

			<div class="flex flex-col gap-2 w-[clamp(120px,50vw,384px)]">
				<div
					class="bg-gray-900 border border-red-900/50 rounded-full w-full h-3 overflow-hidden"
				>
					<div
						class="bg-primary h-full transition-all duration-1000"
						style="width: {((typeof rsvpCount === 'string' ? 289 : rsvpCount) /
							210) *
							100}%"
					></div>
				</div>
				<p class="text-red-200/50 text-sm">
					{rsvpCount} / ??? RSVPs so far
				</p>
			</div>

			<a href="#features" class="self-start animate-bounce">
				<ArrowDown class="w-8 h-8 text-primary" />
			</a>
		</section>

		<div class="w-full leading-none">
			<svg
				viewBox="0 0 1440 100"
				preserveAspectRatio="none"
				class="w-full h-24"
			>
				<path
					d="M0,40 C200,90 400,10 600,50 C800,90 1000,20 1200,60 C1440,85 1440,55 1440,55 L1440,100 L0,100 Z"
					fill="#1a0000"
				/>
				<path
					d="M0,60 C150,30 350,80 550,45 C750,10 950,70 1150,40 C1400,20 1440,50 1440,50 L1440,100 L0,100 Z"
					fill="#200000"
					opacity="0.6"
				/>
			</svg>
		</div>

		<section
			id="features"
			class="flex flex-col items-center gap-16 bg-[#1a0000] px-16 py-24"
		>
			<h2 class="font-alchemize text-center section-title text-3xl">
				HOW IT WORKS
			</h2>

			<div class="gap-6 grid grid-cols-1 md:grid-cols-2 w-full max-w-5xl">
				<div class="feature-card">
					<Blocks class="h-8 w-8 mb-1" />
					<h3 class="font-alchemize text-red-300 text-xl">Create</h3>
					<p class="text-gray-400 text-sm leading-relaxed">
						Pick a theme (Sci-Fi, Anime, or Tribute) and track hours via
						Hackatime.
					</p>
				</div>
				<div class="feature-card">
					<Rocket class="h-8 w-8 mb-1" />
					<h3 class="font-alchemize text-red-300 text-xl">Ship It</h3>
					<p class="text-gray-400 text-sm leading-relaxed">
						Submit your project for review by Master Alchistants to earn theme
						currency.
					</p>
				</div>
				<div class="feature-card">
					<FlaskConical class="h-8 w-8 mb-1" />
					<h3 class="font-alchemize text-red-300 text-xl">Mix Potions</h3>
					<p class="text-gray-400 text-sm leading-relaxed">
						Convert currencies into Potion Mix. Mixing multiple types grants
						bonuses.
					</p>
				</div>
				<div class="feature-card">
					<ShoppingCart class="h-8 w-8 mb-1" />
					<h3 class="font-alchemize text-red-300 text-xl">Dynamic Shop</h3>
					<p class="text-gray-400 text-sm leading-relaxed">
						Spend your Potion Mix on rewards. New items are added weekly based
						on your suggestions!
					</p>
				</div>
			</div>
		</section>

		<section
			id="themes"
			class="flex flex-col items-center gap-16 bg-[#1a0000] px-16 pt-12 pb-95
			  h-auto"
		>
			<h2 class="font-alchemize text-center section-title text-2xl">
				The Three Themes of Season 1
			</h2>

			<div class="gap-6 grid grid-cols-1 md:grid-cols-3 w-full max-w-5xl">
				<div class="feature-card">
					<!-- <span class="text-4xl">⚗️</span> -->
					<h3 class="font-alchemize text-red-300 text-xl">Sci-Fi</h3>
					<p class="text-gray-400 text-sm leading-relaxed">
						Create a project based on Sci-Fi, it can be anything, a website, an
						app, a game, a robot, anything. As long as it's based on Sci-Fi, it
						counts.
					</p>
				</div>
				<div class="feature-card">
					<!-- <span class="text-4xl">🚀</span> -->
					<h3 class="font-alchemize text-red-300 text-xl">Anime</h3>
					<p class="text-gray-400 text-sm leading-relaxed">
						Make something related to your favourite Anime charecter, it can be
						a website, an app, a game, a robot, anything. As long as it's based
						on Anime, it counts.
					</p>
				</div>
				<div class="feature-card">
					<!-- <span class="text-4xl"></span> -->
					<h3 class="font-alchemize text-red-300 text-xl">Tribute</h3>
					<p class="text-gray-400 text-sm leading-relaxed">
						Make a project that pays tribute to something, it can be a person, a
						group, an event, anything. As long as it's a tribute, it counts.
					</p>
				</div>
			</div>
		</section>
		<div class="w-screen leading-none -mt-[20vw]">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"
				><path
					fill="#2f0000"
					fill-opacity="1"
					d="M0,160L30,170.7C60,181,120,203,180,224C240,245,300,267,360,277.3C420,288,480,288,540,277.3C600,267,660,245,720,218.7C780,192,840,160,900,160C960,160,1020,192,1080,208C1140,224,1200,224,1260,197.3C1320,171,1380,117,1410,90.7L1440,64L1440,320L1410,320C1380,320,1320,320,1260,320C1200,320,1140,320,1080,320C1020,320,960,320,900,320C840,320,780,320,720,320C660,320,600,320,540,320C480,320,420,320,360,320C300,320,240,320,180,320C120,320,60,320,30,320L0,320Z"
				></path></svg
			>
		</div>

		<section
			id="faq"
			class="flex flex-col items-center gap-6 px-16 py-24 min-auto pb-75 h-auto bg-[#2f0000] -mt-1"
		>
			<h2 class="font-alchemize text-center section-title text-3xl">FAQ</h2>
			<Accordion
				Title="What is a 'ship'?"
				Content="A 'ship' is the project you submit to this event. You can ship any general project or a project releted to one of the <a class='text-chart-5 p-1 hover:bg-primary/80 transition rounded hover:text-white' href='#themes'>themes</a>"
				addClass="faq-item h-20 w-[clamp(120px,90vw,1084px)] font-sans  relative z-10"
			/>
			<Accordion
				Title="How do I participate?"
				Content="Just Click on Get Started button on the home page or click on <a class='text-chart-5 p-1 hover:bg-primary/80 transition rounded hover:text-white' target='_blank' href={authUrl}>this</a> link."
				addClass="faq-item h-20 w-[clamp(120px,90vw,1084px)] font-sans relative z-10"
			/>
			<Accordion
				Title="Who is Eligible?"
				Content="Anyone ages 13-18 who isn't banned from Hack Club can participate."
				addClass="faq-item h-20 w-[clamp(120px,90vw,1084px)] font-sans relative z-10"
			/>
			<Accordion
				Title="How is time tracked?"
				Content="Software development time is tracked using <a class='text-chart-5 p-1 hover:bg-primary/80 transition rounded hover:text-white' target='_blank' href='hackatime.hackclub.com'>Hackatime</a>"
				addClass="faq-item h-20 w-[clamp(120px,90vw,1084px)] font-sans relative z-10"
			/>
			<Accordion
				Title="What is Hackclub?"
				Content="Hackclub is a community of creative coders who love to build and share their projects. It is also the world’s largest nonprofit movement of teenagers making cool projects."
				addClass="faq-item h-20 w-[clamp(120px,90vw,1084px)] font-sans relative z-10"
			/>
			<Accordion
				Title="Where can I find more information?"
				Content="If you have any questions or need help with anything, just join the <a class='text-chart-5 p-1 hover:bg-primary/80 transition rounded hover:text-white' target='_blank' href='https://hackclub.enterprise.slack.com/archives/C0ASY6R552R'>#alchemize-help</a> channel in the Hack Club Slack! You can ask for help there, and the community will be happy to assist you. "
				addClass="faq-item h-20 w-[clamp(120px,90vw,1084px)] font-sans relative z-10"
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
				><path
					d="M 0,600 L 0,350 C 163.46666666666664,318.4 326.9333333333333,286.8 498,287 C 669.0666666666667,287.2 847.7333333333333,319.2 1006,335 C 1164.2666666666667,350.8 1302.1333333333332,350.4 1440,350 L 1440,600 L 0,600 Z"
					stroke="none"
					stroke-width="0"
					fill="#1a0000"
					fill-opacity="1"
					class="transition-all duration-300 ease-in-out delay-150 path-1"
				></path></svg
			>
			<footer
				class="w-full px-20 absolute items-center flex bg-[#1a0000] pb-10 gap-16 justify-around"
			>
				<div class="row1 flex flex-col gap-5 w-33">
					<h3 class="text-3xl font-semibold font-alchemize">Hackclub</h3>
					<ul class="flex list-none flex-col gap-4">
						<li><a href="https://hackclub.com/philosophy/">Philosphy</a></li>
						<li><a href="https://hackclub.com/team/">Team and Board</a></li>
						<li><a href="https://hackclub.com/brand/">Brand Guide</a></li>
						<li><a href="https://hackclub.com/philanthropy/">Donate</a></li>
						<li><a href="https://hackclub.com/imprint/">Imprint</a></li>
					</ul>
				</div>
				<div class="midrow flex flex-col gap-4">
					<h2>Made with 💖 by TheUtkarsh8939 and Coolcream</h2>
					<h2>© Hackclub, All rights reserved</h2>
				</div>
				<div class="row2 flex flex-col gap-5 w-43">
					<h3 class="text-3xl font-semibold font-alchemize">Resources</h3>
					<ul class="flex list-none flex-col gap-4">
						<li>
							<a href="https://hackclub.com/philosophy/">Community Events</a>
						</li>
						<li><a href="https://hackclub.com/team/">Jams</a></li>
						<li>
							<a href="https://hackclub.com/https://toolbox.hackclub.com/"
								>Toolbox</a
							>
						</li>
						<li><a href="https://hackclub.com/conduct/">Code of Conduct</a></li>
						<li><a href="https://hackclub.com/privacy/">Privacy Policy</a></li>
					</ul>
				</div>
			</footer>
		</div>
	</main>
</div>

<style>
	@import url("https://fonts.googleapis.com/css2?family=Shantell+Sans:ital,wght@0,300..800;1,300..800&display=swap");

	.background-gradient {
		position: fixed;
		background: linear-gradient(45deg, #7f1d1d, #dc2626);
		filter: blur(150px);
		border-radius: 50%;
		transition:
			top 0.7s ease,
			left 0.7s ease;
	}

	.streaks {
		position: fixed;
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
		background: #7f1d1d;
		animation: streak-in 0.6s ease 0.1s both;
	}
	.streak-2 {
		width: 65%;
		top: 13%;
		height: 12px;
		background: #991b1b;
		animation: streak-in 0.6s ease 0.2s both;
	}
	.streak-3 {
		width: 50%;
		top: 19%;
		height: 8px;
		background: #b91c1c;
		animation: streak-in 0.6s ease 0.3s both;
	}
	.streak-4 {
		width: 35%;
		top: 24%;
		height: 5px;
		background: #dc2626;
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
		color: transparent;
		-webkit-text-stroke: 3px var(--color-primary);
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
		font-family: var(--font-alchemize);
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
