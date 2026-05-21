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
	class="flex gap-4 bg-gradbg p-4 w-screen h-screen overflow-hidden text-foreground"
>
	<div class="h-full w-[50%] flex flex-col p-6">
		<div>
			<div class="w-full h-[10vh] flex items-center justify-between p-2">
				<div
					class="bg-background/80 w-full h-full flex items-center justify-center rounded-l-xl border border-white"
				>
					<p id="ref-link">{linkText}</p>
				</div>
				<button
					class="h-full w-[10%] bg-primary rounded-r-xl border border-white p-1 hover:bg-primary/70 transition"
					onclick={onCopy}
				>
					Copy
				</button>
			</div>
		</div>
	</div>
</main>
