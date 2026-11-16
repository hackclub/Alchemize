<script>
	import Button from "$lib/components/ui/button/button.svelte"
</script>

<aside class="flex h-full w-1/5 flex-col gap-y-4 border-r-2 p-2 pr-3">
	<div class="flex items-center justify-start gap-x-2">
		<!-- <div class="bg-white rounded-full h-8 w-8"></div> -->
		<div class=" flex flex-col items-start justify-start">
			<p class="text-xl text-primary-foreground">Supaadmin</p>
			<p class="text-xs text-muted-foreground">admin</p>
		</div>
	</div>
	<Button class="border-2 border-muted bg-primary hover:scale-104">
		<a href="/admin/super-admin/nps-results"> NPS results </a>
	</Button>
	<Button class="border-2 border-muted bg-primary hover:scale-104" disabled>User Data Regen</Button>
</aside>
