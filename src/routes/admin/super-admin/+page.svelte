<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte"
	import Input from "$lib/components/ui/input/input.svelte"

	let { data } = $props()
	let userId = 1

	let searchQuery = $state("")

	let filteredUsers = $derived(
		data.userData.filter((user: any) => user.fields?.email?.toLowerCase().includes(searchQuery.toLowerCase()))
	)
</script>

<svelte:head>
	<title>Alchemize | Super Admin</title>
	<meta name="description" content="Alchemize Super Admin" />
	<meta property="og:title" content="Alchemize | Super Admin" />
</svelte:head>

<main class="flex h-full w-full items-center justify-center gap-x-5 p-5">
	<div class="flex h-full w-full flex-col items-start justify-start overflow-y-scroll">
		<div class="sticky mb-6 flex w-full items-center gap-x-4 p-2">
			<Input placeholder="Search users using email...." bind:value={searchQuery} />
		</div>

		{#each filteredUsers as user}
			<div class="users-list flex w-full list-none flex-col items-center justify-start gap-y-2 p-2">
				<li class="flex w-full items-center justify-between rounded-xl border-2 bg-background/40 p-2 py-1">
					<p class="font-alchemize">{user.fields.email}</p>
					<a href={`/admin/super-admin/users/${user.fields.email}`}>
						<Button class="border border-muted bg-primary hover:scale-104">View user</Button>
					</a>
				</li>
			</div>
		{/each}

		{#if filteredUsers.length === 0}
			<p class="w-full p-4 text-center text-sm text-muted-foreground">
				No users found matching "{searchQuery}"
			</p>
		{/if}
	</div>
</main>
