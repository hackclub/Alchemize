<script>
	import Nav from "$lib/Nav.svelte"
	import { PUBLIC_HACKCLUB_AUTH,PUBLIC_HACKCLUB_REDIRECT } from "$env/static/public"
	import { browser } from "$app/environment"
	import { onMount } from "svelte"
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
		console.log(blob)

		window.addEventListener("mousemove", event => {
			blob?.animate(
				{
					top: `${event.pageY - 150}px`,
					left: `${event.pageX - 150}px`,
				},
				{ duration: 700, fill: "forwards" }
			)
		})
	})
</script>

<Nav />
<div
	class="center-ovr w-screen h-screen flex items-center justify-center top-0"
>
	<div class="alchemy flex items-center justify-center pb-10">
		<div class="second-cont w-[clamp(200px, 100vw, 768px)]">
			<h1
				class=" text-[clamp(24px,10vw,60px)] flex items-center gap-2 font-bold"
			>
				<img src="/Alchemist.webp" alt="" class="logo aspect-square" />
				<span class="font alchemizefont text-[#ff2e2e]">Alchemize</span>
			</h1>
			<div class="description">
				<div class="flex justify-center w-full flex-col">
					<p
						class="text-gray-300 text-justify mt-1 text-lg gap-2 flex flex-col description"
					>
						<span class="text-[clamp(10px,3vw,30px)] font-bold"
							>3 Themes, 3 Currencies and a Dynamic Shop</span
						>
						<span class="text-[clamp(8px,2vw,20px)]"
							>Under Draft | Hackclub Ages 13-18</span
						>
					</p>
					<div class="form flex">
						<input
							type="text"
							placeholder="Enter your Email"
							class="h-10 w-[clamp(200px,80vw,400px)] relative z-10 email border border-red-500 mt-5 rounded-l-md text-gray-400 pl-2 outline-none"
						/>
						<div
							class="flex mt-5 h-10 buttons w-[clamp(200px,80vw,400px)] gap-1"
						>
							<a href={authUrl} class=" button w-28">
								<button
									class="h-10 relative z-10 w-full bg-red-600 get-started text-gray-200 font-bold border border-red-600 hover:bg-red-500 ml-1 text-md"
								>
									Get Started
								</button>
							</a>
							<a
								href="https://hackclub.enterprise.slack.com/archives/C0ASY6R552R"
								target="_blank"
								class="button w-28"
							>
								<button
									class="relative h-10 z-10 w-full bg-gray-600 slack text-gray-300 font-bold border border-gray-600 rounded-r-md hover:bg-gray-500 hover:text-gray-300 ml-1 text-md"
								>
									Join Slack!!
								</button>
							</a>
						</div>
					</div>
					<div class="rsvp pt-3 flex items-center">
						<div class="progress-bar w-[clamp(200px,80vw,400px)] h-1 border border-gray-700 rounded-full">
							<div class="bg-red-600 h-full w-full" style="width: {data.rsvpCount/3}%;"></div>
						</div>
						<span class="text-gray-400 text-sm ml-2">{data.rsvpCount}/300 RSVPs So far</span>
					</div>
					<div class="rsvpLink">
						Click Here to RSVP if you haven't already: <a href="https://rsvp.hackclub.community/alchemize-ysws" target="_blank" class="text-blue-500 hover:underline relative z-20">RSVP</a>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="scroll-down text-gray-400 absolute bottom-10 text-xl flex items-center gap-2">
		<i class="fa-solid fa-computer-mouse"></i>
		Scroll Down
	</div>
</div>
<div class="absolute -z-10 w-screen h-screen top-0">
	<div class="img absolute -z-20 w-full h-full"></div>
	<div class="ovr h-full w-screen -z-10"></div>
</div>

<div
	class="how-to-participate w-screen bg-black flex items-center text-white flex-col pb-50"
>
	<h1 class="alchemizefont text-5xl text-[#fc6565]">How does it work?</h1>
	<div class="grid grid-cols-2 gap-4 mt-10 hdiw">
		<div
			class="card flex w-90 h-48 border border-red-600 border-dashed flex flex-col items-center justify-center rounded-md"
		>
			<i class="fa-solid fa-code mb-2 text-3xl"></i>
			<h2 class="text-3xl text-justify alchemizefont font-bold">
				Create Project
			</h2>
			<p
				class="text-gray-300 text-center text-sm mt-2 text-justify w-3/4 leading-5"
			>
				Make a general project, or Choose any theme from our 3 themes for your
				project, and track your time with a Timing system like Hackatime
			</p>
		</div>
		<div
			class="card flex w-90 h-48 border border-red-600 border-dashed flex flex-col items-center justify-center rounded-md"
		>
			<i class="fa-solid fa-ship text-3xl mb-2"></i>
			<h2 class="text-3xl text-justify alchemizefont font-bold">Ship It</h2>
			<p
				class="text-gray-300 text-center text-sm mt-2 text-justify w-3/4 leading-5"
			>
				Ship your completed project, and let it get reviewed by our Master
				Alchistants, once approved you will earn the currency of that theme.
			</p>
		</div>
		<div
			class="card flex w-90 h-48 border border-red-600 border-dashed flex flex-col items-center justify-center rounded-md"
		>
			<i class="fa-solid fa-flask mb-2 text-3xl"></i>
			<h2 class="text-3xl text-justify alchemizefont font-bold">
				Convert to Potion Mix
			</h2>
			<p
				class="text-gray-300 text-center text-sm mt-2 text-justify w-3/4 leading-5"
			>
				Convert your earned currency to Potion Mix, and use it to buy items from
				the shop. Converting 2 or more currency together gives you bonus.
			</p>
		</div>
		<div
			class="card flex w-90 h-48 border border-red-600 border-dashed flex flex-col items-center justify-center rounded-md"
		>
			<i class="fa-solid fa-bag-shopping mb-2 text-3xl"></i>
			<h2 class="text-3xl text-justify alchemizefont font-bold">
				Shop your Rewards
			</h2>
			<p
				class="text-gray-300 text-center text-sm mt-2 text-justify w-3/4 leading-5"
			>
				Our shop is dynamic, with new items added every week. You suggest the
				items, we add it. Spend your Potion Mix there.
			</p>
		</div>
	</div>
	<div class="themes mt-28 flex flex-col items-center gap-10">
		<h2 class="text-5xl alchemizefont text-[#fc6565]">Season 1 Themes</h2>
		<div class="grid grid-cols-3 gap-10 s1t">
			<div
				class="card flex blue-card w-90 h-48 border border-blue-600 border-dashed flex flex-col items-center justify-center rounded-md"
			>
				<i class="fa-solid fa-jedi mb-2 text-3xl"></i>
				<h2 class="text-3xl text-justify alchemizefont font-bold">Sci-Fi</h2>
				<p
					class="text-gray-300 text-center text-sm mt-2 text-justify w-3/4 leading-5"
				>
					Create a project based on Sci-Fi, it can be anything, a website, an
					app, a game, a robot, anything. As long as it's based on Sci-Fi, it
					counts.
				</p>
			</div>
			<div
				class="card flex w-90 h-48 border border-red-600 border-dashed flex flex-col items-center justify-center rounded-md"
			>
				<i class="fa-solid fa-dragon mb-2 text-3xl"></i>
				<h2 class="text-3xl text-justify alchemizefont font-bold">Anime</h2>
				<p
					class="text-gray-300 text-center text-sm mt-2 text-justify w-3/4 leading-5"
				>
					Make something related to your favourite Anime charector, it can be a
					website, an app, a game, a robot, anything. As long as it's based on
					Anime, it counts.
				</p>
			</div>
			<div
				class="card flex green-card w-90 h-48 border border-green-600 border-dashed flex flex-col items-center justify-center rounded-md"
			>
				<i class="fa-solid fa-tencent-weibo text-3xl mb-2"></i>

				<h2 class="text-3xl text-justify alchemizefont font-bold">Tribute</h2>
				<p
					class="text-gray-300 text-center text-sm mt-2 text-justify w-3/4 leading-5"
				>
					Make a project that pays tribute to something, it can be a person, a
					group, an event, anything. As long as it's a tribute, it counts.
				</p>
			</div>
		</div>
	</div>
	<div class="abtHC flex flex-col items-center mt-28 gap-5">
		<h2 class="text-5xl alchemizefont text-[#fc6565] flex">
			About <img src="./hackclub.png" alt="Hackclub" class="h-16 width-auto" />
		</h2>
		<p
			class="card text-gray-300 text-center text-md text-justify w-[clamp(300px,80vw,600px)] leading-5 border border-red-600 border-dashed p-5 rounded-md"
		>
			Hack Club is a 501(c)(3) nonprofit that supports high school coding clubs
			around the world. Founded in 2014, Hack Club has grown to over 400 clubs
			in 50+ countries, with a community of over 110,000 students. Hack Club
			hosts Hackathons and programs around the Globe to allow Teenagers to
			learn, create and ship their projects. We provide tools, funding and
			community to help students turn their ideas into reality.
		</p>
	</div>
</div>
<div
	id="blob"
	class="background-gradient absolute z-1 left-0 blur-[180px] size-45"
></div>

<style>
	@import url("https://fonts.googleapis.com/css2?family=Saira+Stencil:ital,wght@0,100..900;1,100..900&display=swap");

	.img {
		background-image: url("/bg2.webp");
		background-size: cover;
		background-position: center;
	}
	.ovr {
		background: linear-gradient(
			#000000a9,
			#000000a9,
			#000000a9,
			#000000a9,
			#000000
		);
	}
	.alchemy {
		height: 100vh;
		width: 50vw;
	}
	.alchemizefont {
		font-family: "Saira Stencil", cursive;
	}
	.logo {
		width: clamp(20px, 8vw, 64px);
	}
	@media screen and (max-width: 900px) {
		.second-cont {
			display: flex;
			flex-direction: column;
			align-items: center;
			text-align: center;
		}
		.description {
			display: flex;
			flex-direction: column;
			align-items: center;
			text-align: center;
		}
		.form {
			flex-direction: column;
			gap: 0px;
		}
		.buttons {
			margin-top: 3px !important;
			margin-left: 0px !important;
		}
		.button {
			width: 50%;
		}
		.email {
			border-radius: 10px 10px 0px 0px !important;
			margin-left: 4px;
		}
		.get-started {
			border-radius: 0px 0px 0px 10px !important;
		}
		.slack {
			border-radius: 0px 0px 10px 0px !important;
		}
		.hdiw {
			grid-template-columns: 1fr !important;
		}
	}
	@media screen and (max-width: 1000px) {
		.s1t {
			grid-template-columns: 1fr !important;
		}
	}
	.card{
		position: relative;
		z-index: 10;
	}
	.card:hover {
		box-shadow: 0px 0px 10px 2px #ff0000 !important;
	}
	.blue-card:hover {
		box-shadow: 0px 0px 10px 2px #3b82f6 !important;
	}
	.green-card:hover {
		box-shadow: 0px 0px 10px 2px #22c55e !important;
	}
	.background-gradient {
		background: linear-gradient(45deg, rgb(255, 0, 0), rgb(247, 0, 255));
		animation: gradientAnimation 10s ease infinite;
	}
	.backblur {
		backdrop-filter: blur(20px);
	}
</style>
