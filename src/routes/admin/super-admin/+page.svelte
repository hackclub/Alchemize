<script>
	import Button from "$lib/components/ui/button/button.svelte"
	import Input from "$lib/components/ui/input/input.svelte"
</script>

<main class="w-full h-full p-5 flex items-center justify-center gap-x-5">
	<div class="h-full w-full flex flex-col items-start justify-start gap-y-5">
		<div class="flex items-center gap-x-4 p-2 w-full">
			<Input placeholder="Search users using email...." />
		</div>
		<div
			class="users-list w-full h-full flex flex-col items-center justify-start gap-y-2 list-none p-2"
		>
			<li
				class="w-full py-1 bg-background/40 rounded-xl border-2 p-2 flex items-center justify-between"
			>
				<p class="font-alchemize">coolcream</p>
				<Button class="bg-admin-primary border border-muted hover:scale-104">
					View user
				</Button>
			</li>
		</div>
	</div>
</main>
