<script lang="ts">
	import { ArrowDown } from "lucide-svelte"
	import { onMount } from "svelte"
	import { browser } from "$app/environment"
	import {
		PUBLIC_HACKCLUB_AUTH,
		PUBLIC_HACKCLUB_REDIRECT,
	} from "$env/static/public"

	let { data } = $props()
	const clientId = PUBLIC_HACKCLUB_AUTH
	const uri = encodeURIComponent(PUBLIC_HACKCLUB_REDIRECT)

	const hasIdToken =
		browser &&
		document.cookie.split("; ").find(row => row.startsWith("id_token="))

	const authUrl = hasIdToken
		? `./dashboard`
		: `https://auth.hackclub.com/oauth/authorize?client_id=${clientId}&response_type=code&scope=openid+profile+email&redirect_uri=${uri}`

	onMount(() => {
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
	class="z-20 fixed opacity-70 blur-[180px] size-32 pointer-events-none background-gradient"
></div>

<div
	class="relative bg-linear-to-br from-neutral-900 via-rose-950 to-red-900 w-screen min-h-screen overflow-x-hidden"
>
	<div class="top-0 left-0 -z-10 fixed bg-black/70 w-full h-full"></div>

	<div class="streaks">
		<div class="streak streak-1"></div>
		<div class="streak streak-2"></div>
		<div class="streak streak-3"></div>
		<div class="streak streak-4"></div>
	</div>

	<main class="z-10 relative">
		<section class="flex flex-col justify-center gap-y-8 px-16 min-h-screen">
			<div class="flex items-center gap-4">
				<img src="/Alchemist.webp" alt="" class="w-16 h-16" />
				<span
					class="font-alchemize text-primary text-2xl uppercase tracking-widest"
				>
					Hack Club
				</span>
			</div>

			<h1 class="font-alchemize hero-title">ALCHEMIZE</h1>

			<p class="text-red-200/80 text-2xl leading-relaxed">
				Turn your code into prizes.<br />
				<strong class="text-white text-3xl">And you're invited.</strong>
				<br />
				<span class="opacity-70 text-lg">Ages 13-18 </span>
			</p>

			<a href={authUrl} class="cta-btn">
				<span class="cta-text">GET STARTED</span>
				<div class="cta-chevrons">
					<span>›</span><span>›</span><span>›</span>
				</div>
			</a>

			<div class="flex flex-col gap-2 max-w-sm">
				<div
					class="bg-gray-900 border border-red-900/50 rounded-full w-full h-3 overflow-hidden"
				>
					<div
						class="bg-primary h-full transition-all duration-1000"
						style="width: {(data.rsvpCount / 300) * 100}%"
					></div>
				</div>
				<p class="text-red-200/50 text-sm">
					{data.rsvpCount} / 300 RSVPs so far
				</p>
			</div>

			<a href="#features" class="self-start mt-4 animate-bounce">
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
			class="flex flex-col items-center gap-16 bg-[#1a0000] px-16 py-24 min-h-screen"
		>
			<h2 class="font-alchemize text-center section-title">HOW IT WORKS</h2>

			<div class="gap-6 grid grid-cols-1 md:grid-cols-2 w-full max-w-5xl">
				<div class="feature-card">
					<span class="text-4xl">⚗️</span>
					<h3 class="font-alchemize text-red-300 text-xl">Create</h3>
					<p class="text-gray-400 text-sm leading-relaxed">
						Pick a theme (Sci-Fi, Anime, or Tribute) and track hours via
						Hackatime.
					</p>
				</div>
				<div class="feature-card">
					<span class="text-4xl">🚀</span>
					<h3 class="font-alchemize text-red-300 text-xl">Ship It</h3>
					<p class="text-gray-400 text-sm leading-relaxed">
						Submit your project for review by Master Alchistants to earn theme
						currency.
					</p>
				</div>
				<div class="feature-card">
					<span class="text-4xl">🧪</span>
					<h3 class="font-alchemize text-red-300 text-xl">Mix Potions</h3>
					<p class="text-gray-400 text-sm leading-relaxed">
						Convert currencies into Potion Mix. Mixing multiple types grants
						bonuses.
					</p>
				</div>
				<div class="feature-card">
					<span class="text-4xl">🛒</span>
					<h3 class="font-alchemize text-red-300 text-xl">Dynamic Shop</h3>
					<p class="text-gray-400 text-sm leading-relaxed">
						Spend your Potion Mix on rewards. New items are added weekly based
						on your suggestions!
					</p>
				</div>
			</div>
		</section>
	</main>
</div>

<style>
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
		font-size: clamp(4rem, 12vw, 10rem);
		line-height: 1;
		color: transparent;
		-webkit-text-stroke: 3px var(--color-primary);
	}

	.cta-btn {
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: 400px;
		background: var(--color-primary);
		border: 3px solid #7f1d1d;
		border-radius: 1rem;
		padding: 1.2rem 2rem;
		text-decoration: none;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.cta-btn:hover {
		transform: scale(1.02);
		box-shadow: 0 0 40px rgba(185, 28, 28, 0.5);
	}

	.cta-text {
		font-family: var(--font-alchemize);
		font-size: 1.5rem;
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
