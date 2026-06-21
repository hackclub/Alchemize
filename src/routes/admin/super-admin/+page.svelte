<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte"
	import Input from "$lib/components/ui/input/input.svelte"

	let { data } = $props()
	let userId = 1

	let searchQuery = $state("")

	let filteredUsers = $derived(
		data.userData.filter((user: any) =>
			user.fields?.email?.toLowerCase().includes(searchQuery.toLowerCase())
		)
	)
</script>

<svelte:head>
	<title>Alchemize | Super Admin</title>
	<meta name="description" content="Alchemize Super Admin" />
	<meta property="og:title" content="Alchemize | Super Admin" />
</svelte:head>

<main class="w-full h-full p-5 flex items-center justify-center gap-x-5">
	<div
		class="h-full w-full flex flex-col items-start justify-start overflow-y-scroll"
	>
		<div class="flex items-center gap-x-4 p-2 w-full mb-6 sticky">
			<Input
				placeholder="Search users using email...."
				bind:value={searchQuery}
			/>
		</div>

		{#each filteredUsers as user}
			<div
				class="users-list w-full flex flex-col items-center justify-start gap-y-2 list-none p-2"
			>
				<li
					class="w-full py-1 bg-background/40 rounded-xl border-2 p-2 flex items-center justify-between"
				>
					<p class="font-alchemize">{user.fields.email}</p>
					<a href={`/admin/super-admin/users/${user.fields.email}`}>
						<Button
							class="bg-admin-primary border border-muted hover:scale-104"
						>
							View user
						</Button>
					</a>
				</li>
			</div>
		{/each}

		{#if filteredUsers.length === 0}
			<p class="text-muted-foreground text-sm p-4 text-center w-full">
				No users found matching "{searchQuery}"
			</p>
		{/if}
	</div>
</main>
