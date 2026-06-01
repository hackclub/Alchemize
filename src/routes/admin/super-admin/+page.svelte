<script>
	import Button from "$lib/components/ui/button/button.svelte"
	import Input from "$lib/components/ui/input/input.svelte"
	let { data } = $props()
	let userId = 1
	
</script>

<main class="w-full h-full p-5 flex items-center justify-center gap-x-5">
	<div class="h-full w-full flex flex-col items-start justify-start overflow-y-scroll">
		<div class="flex items-center gap-x-4 p-2 w-full mb-6 sticky ">
			<Input placeholder="Search users using email...." />
		</div>
	
			{#each data.userData as user }
				<div
				class="users-list w-full  flex flex-col items-center justify-start gap-y-2 list-none p-2"
			>
				<li
					class="w-full py-1 bg-background/40 rounded-xl border-2 p-2 flex items-center justify-between"
				>
					<p class="font-alchemize">{user.fields.email}</p>
					<a href={`/admin/super-admin/users/${user.id}`}>
						<Button
							class="bg-admin-primary border border-muted hover:scale-104"
						>
							View user
						</Button>
					</a>
				</li>
			</div>
			{/each}
			
		</div>

</main>
