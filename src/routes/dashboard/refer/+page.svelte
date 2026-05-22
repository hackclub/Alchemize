<script>
	let linkText = "referral link goes here"

	async function onCopy() {
		try {
			await navigator.clipboard.writeText(linkText)
			console.log("Copied:", linkText)
		} catch (err) {
			console.error("Copy failed:", err)
		}
	}
</script>

<main
	class="flex gap-6 bg-gradbg p-6 w-screen h-screen overflow-hidden text-foreground"
>
	<div class="h-full w-[50%] flex flex-col gap-y-6">
		<div class="w-full flex items-center justify-between shadow-sm">
			<div
				class="bg-background/80 w-full py-3 px-4 flex items-center justify-start rounded-l-xl border border-primary"
			>
				<p id="ref-link" class="font-mono text-sm tracking-wide opacity-90">
					{linkText}
				</p>
			</div>
			<button
				class="h-full px-5 py-2.5 bg-primary rounded-r-xl font-medium shadow-sm hover:bg-primary/80 hover:scale-[1.02] transition-all duration-150 font-alchemize"
				onclick={onCopy}
			>
				Copy
			</button>
		</div>
		<div
			class="w-full flex-1 flex flex-col p-5 bg-background/40 rounded-3xl gap-3 min-h-0 shadow-lg backdrop-blur-sm"
		>
			<h1 class="font-alchemize text-2xl text-center mb-2 tracking-wide">
				Your Referrals
			</h1>
			<div class="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
				<div
					class="w-full rounded-xl border border-primary/40 bg-background flex items-center justify-between gap-4 p-4 shadow-sm hover:border-primary/80 transition-all duration-200"
				>
					<p class="text-xl">Cool Cream</p>
					<img
						src="/Alchemize.png"
						alt=""
						class="h-10 w-10 object-cover rounded-full border-2 border-white/80 p-0.5 shadow-sm"
					/>
				</div>
				<div
					class="w-full rounded-xl border border-primary/40 bg-background flex items-center justify-between gap-4 p-4 shadow-sm hover:border-primary/80 transition-all duration-200"
				>
					<p class="text-xl">Cool Cream</p>
					<img
						src="/Alchemize.png"
						alt=""
						class="h-10 w-10 object-cover rounded-full border-2 border-white/80 p-0.5 shadow-sm"
					/>
				</div>
				<div
					class="w-full rounded-xl border border-primary/40 bg-background flex items-center justify-between gap-4 p-4 shadow-sm hover:border-primary/80 transition-all duration-200"
				>
					<p class="text-xl">Cool Cream</p>
					<img
						src="/Alchemize.png"
						alt=""
						class="h-10 w-10 object-cover rounded-full border-2 border-white/80 p-0.5 shadow-sm"
					/>
				</div>
			</div>
		</div>
	</div>
	<div class="h-full w-[50%] flex flex-col gap-y-6">
		<div
			class="w-full h-full flex flex-col p-5 bg-background/40 rounded-3xl gap-3 min-h-0 shadow-lg backdrop-blur-sm"
		>
			<h1 class="font-alchemize text-2xl text-center mb-2 tracking-wide">
				Top referers
			</h1>
			<div class="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
				<div
					class="w-full rounded-xl border border-primary/40 bg-background flex items-center justify-between gap-4 p-4 shadow-sm hover:border-primary/80 transition-all duration-200"
				>
					<p class="text-xl">Cool Cream</p>
					<p class="text-xl font-bold text-primary">10</p>
				</div>
				<div
					class="w-full rounded-xl border border-primary/40 bg-background flex items-center justify-between gap-4 p-4 shadow-sm hover:border-primary/80 transition-all duration-200"
				>
					<p class="text-xl">Cool Cream</p>
					<p class="text-xl font-bold text-primary">7</p>
				</div>
				<div
					class="w-full rounded-xl border border-primary/40 bg-background flex items-center justify-between gap-4 p-4 shadow-sm hover:border-primary/80 transition-all duration-200"
				>
					<p class="text-xl">Cool Cream</p>
					<p class="text-xl font-bold text-primary">4</p>
				</div>
			</div>
		</div>
	</div>
</main>
