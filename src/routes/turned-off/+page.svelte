<script>
	import Button from "$lib/components/ui/button/button.svelte"
</script>

<div
	class="h-screen w-full bg-gradbg flex flex-col gap-y-5 items-center justify-center p-5"
>
	<p class="max-w-3xl text-center text-xl text-admin-text">
		Heya! While we conduct some mandatory maintenance, the dashboard is
		temporarily unavailable. Feel free to read our documentation while you wait
	</p>
	<a href="/docs">
		<Button class="p-5 px-15 text-xl hover:-translate-y-px hover:bg-primary/70">
			Read the docs
		</Button>
	</a>
</div>
