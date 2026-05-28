<script>
	import Button from "$lib/components/ui/button/button.svelte"

	
</script>

<aside class="h-full w-1/5 border-r-2 p-2 flex flex-col gap-y-4">
	<div class="flex items-center justify-start gap-x-2">
		<div class="bg-white rounded-full h-8 w-8"></div>
		<div class=" flex flex-col items-start justify-start">
			<p class="text-sm text-white">coolcream</p>
			<p class="text-muted-foreground text-xs">admin</p>
		</div>
	</div>
	<Button class="bg-admin-primary border-2 border-muted hover:scale-104">
		User Data Regen
	</Button>
</aside>
