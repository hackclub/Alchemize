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
		: `https://auth.hackclub.com/oauth/authorize?client_id=${clientId}&response_type=code&scope=openid+profile+email+slack_id&redirect_uri=${uri}`

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

<Nav />
<div
	class="top-0 flex justify-center items-center w-screen h-screen center-ovr"
>
	<div class="flex justify-center items-center pb-10 alchemy">
		<div class="w-[clamp(200px, second-cont 100vw, 768px)]">
			<h1
				class="flex items-center gap-2 font-bold text-[clamp(24px,10vw,60px)]"
			>
				<img src="/Alchemist.webp" alt="" class="aspect-square logo" />
				<span class="text-[#ff2e2e] font alchemizefont">Alchemize</span>
			</h1>
			<div class="description">
				<div class="flex flex-col justify-center w-full">
					<p
						class="flex flex-col gap-2 mt-1 text-gray-300 text-lg text-justify description"
					>
						<span class="font-bold text-[clamp(10px,3vw,30px)]"
							>3 Themes, 3 Currencies and a Dynamic Shop</span
						>
						<span class="text-[clamp(8px,2vw,20px)]"
							>Under Draft | Hackclub Ages 13-18</span
						>
					</p>
					<div class="flex form">
						<input
							type="text"
							placeholder="Enter your Email"
							class="z-10 relative mt-5 pl-2 border border-red-500 rounded-l-md outline-none w-[clamp(200px,80vw,400px)] h-10 text-gray-400 email"
						/>
						<div
							class="flex gap-1 mt-5 w-[clamp(200px,80vw,400px)] h-10 buttons"
						>
							<a href={authUrl} class="w-28 button">
								<button
									class="z-10 relative bg-red-600 hover:bg-red-500 ml-1 border border-red-600 w-full h-10 font-bold text-gray-200 text-md get-started"
								>
									Get Started
								</button>
							</a>
							<a
								href="https://hackclub.enterprise.slack.com/archives/C0ASY6R552R"
								target="_blank"
								class="w-28 button"
							>
								<button
									class="z-10 relative bg-gray-600 hover:bg-gray-500 ml-1 border border-gray-600 rounded-r-md w-full h-10 font-bold text-gray-300 text-md hover:text-gray-300 slack"
								>
									Join Slack!!
								</button>
							</a>
						</div>
					</div>
					<div class="flex items-center pt-3 rsvp">
						<div class="border border-gray-700 rounded-full w-[clamp(200px,80vw,400px)] h-1 progress-bar">
							<div class="bg-red-600 w-full h-full" style="width: {data.rsvpCount/3}%;"></div>
						</div>
						<span class="ml-2 text-gray-400 text-sm">{data.rsvpCount}/300 RSVPs So far</span>
					</div>
					<div class="rsvpLink">
						Click Here to RSVP if you haven't already: <a href="https://rsvp.hackclub.community/alchemize-ysws" target="_blank" class="text-blue-500 hover:underline">RSVP</a>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="bottom-10 absolute flex items-center gap-2 text-gray-400 text-xl scroll-down">
		<i class="fa-solid fa-computer-mouse"></i>
		Scroll Down
	</div>
</div>
<div class="top-0 -z-10 absolute w-screen h-screen">
	<div class="-z-20 absolute w-full h-full img"></div>
	<div class="-z-10 w-screen h-full ovr"></div>
</div>

<div
	class="flex flex-col items-center bg-black how-to-participate pb-50 w-screen text-white"
>
	<h1 class="text-[#fc6565] text-5xl alchemizefont">How does it work?</h1>
	<div class="gap-4 grid grid-cols-2 mt-10 hdiw">
		<div
			class="flex flex flex-col justify-center items-center border border-red-600 border-dashed rounded-md w-90 h-48 card"
		>
			<i class="mb-2 text-3xl fa-solid fa-code"></i>
			<h2 class="font-bold text-3xl text-justify alchemizefont">
				Create Project
			</h2>
			<p
				class="mt-2 w-3/4 text-gray-300 text-sm text-center text-justify leading-5"
			>
				Make a general project, or Choose any theme from our 3 themes for your
				project, and track your time with a Timing system like Hackatime
			</p>
		</div>
		<div
			class="flex flex flex-col justify-center items-center border border-red-600 border-dashed rounded-md w-90 h-48 card"
		>
			<i class="mb-2 text-3xl fa-solid fa-ship"></i>
			<h2 class="font-bold text-3xl text-justify alchemizefont">Ship It</h2>
			<p
				class="mt-2 w-3/4 text-gray-300 text-sm text-center text-justify leading-5"
			>
				Ship your completed project, and let it get reviewed by our Master
				Alchistants, once approved you will earn the currency of that theme.
			</p>
		</div>
		<div
			class="flex flex flex-col justify-center items-center border border-red-600 border-dashed rounded-md w-90 h-48 card"
		>
			<i class="mb-2 text-3xl fa-solid fa-flask"></i>
			<h2 class="font-bold text-3xl text-justify alchemizefont">
				Convert to Potion Mix
			</h2>
			<p
				class="mt-2 w-3/4 text-gray-300 text-sm text-center text-justify leading-5"
			>
				Convert your earned currency to Potion Mix, and use it to buy items from
				the shop. Converting 2 or more currency together gives you bonus.
			</p>
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
