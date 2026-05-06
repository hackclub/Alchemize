<script lang="ts">
	import { onMount } from "svelte"
	import { jwtDecode } from "jwt-decode"
	interface UserInfo {
		name: string
		email: string
		nickname: string
		auth_time: number
	}
	let decodedToken: UserInfo
	let name = $state("")
	let email = $state("")
	onMount(() => {
		// @ts-ignore
		let id_token = document.cookie
			.split("; ")
			.find(row => row.startsWith("id_token="))
			.split("=")[1]
		decodedToken = jwtDecode(id_token)
		console.log(decodedToken)
		name = decodedToken.name
		email = decodedToken.email
		console.log(id_token)
	})
</script>

<main
	class="root grad-bg flex items-center justify-center text-white flex-col relative -z-10"
>
	<div class="image-container">
		<div class="stage">
			<img
				src="/dashStatic/dashboard_bg.png"
				alt="background"
				class="background-image"
			/>
			<img src="/dashStatic/Exchange.png" alt="overlay" class="overlay-image" />
		</div>
	</div>
</main>

<style>
	.grad-bg {
		background: #000000;
	}
	.root {
		width: 100%;
		height: 100vh;
	}

	.image-container {
		position: relative;
		width: 100%;
		height: 100vh;
		max-width: 100%;
		overflow: hidden;
	}

	.stage {
		position: absolute;
		top: 0;
		left: 0;
		width: 2752px;
		height: 1536px;
		transform-origin: top left;
		transform: scale(calc(100vh / 1536px));
	}

	.background-image {
		width: 100%;
		height: 100%;
		display: block;
		object-fit: cover;
		object-position: left;
	}

	.overlay-image {
		width: auto;
		height: 445px;
	}
	.overlay-image {
		position: absolute;
		top: 730px;
		left: 680px;
	}
	.overlay-image:hover {
		transform: scale(1.05);
		transition: transform 0.3s ease-in-out;
	}
</style>
