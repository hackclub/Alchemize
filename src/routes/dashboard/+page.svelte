<main class="root grad-bg flex items-center justify-center text-white flex-col">
	<div class="image-container">
		<div class="stage">
			<img
				src="/dashStatic/dashboard_bg.png"
				alt="background"
				class="background-image"
			/>
            <a href="/dashboard/exchange">
            			<img
				src="/dashStatic/Exchange.png"
				alt="overlay"
				class="ovrImg"
				style="top: 730px; left: 680px; height: 445px;"
			/></a>
            <a href="/dashboard/projects">
            			<img
				src="/dashStatic/lab.png"
				alt="overlay"
				class="ovrImg"
				style="top: 26px; left: 512px; height: 740px;"
			/></a>
            <a href="/dashboard/shop">
                			<img
				src="/dashStatic/shop.png"
				alt="overlay"
				class="ovrImg"
				style="top: 620px; left: 202px; height: 440px;"
			/>
            </a>
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

	.ovrImg {
		width: auto;

		position: absolute;

		transition: transform 0.3s ease-in-out;
	}

	.ovrImg:hover {
		filter: brightness(1.4);
	}
</style>
