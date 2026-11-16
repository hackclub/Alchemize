<script>
	import Button from "$lib/components/ui/button/button.svelte"
</script>

<div class="bg-gradbg flex h-screen w-full flex-col items-center justify-center gap-y-5 p-5">
	<p class="max-w-3xl text-center text-xl text-primary">
		Heya! While we conduct some mandatory maintenance, the dashboard is temporarily unavailable. Feel free to read our
		documentation while you wait
	</p>
	<a href="/docs">
		<Button class="p-5 px-15 text-xl hover:-translate-y-px hover:bg-primary/70">Read the docs</Button>
	</a>
</div>
