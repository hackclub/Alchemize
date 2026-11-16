<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte"
	import Switch from "$lib/components/ui/switch/switch.svelte"
	import Input from "$lib/components/ui/input/input.svelte"
	import { ArrowLeft } from "lucide-svelte"
	import { SLACK_USER_ID_PATTERN } from "$lib/roles"
	let { data } = $props()
	let isReviewer = $state(data.isReviewer ?? false)
	let isT2Reviewer = $state(data.isT2Reviewer ?? false)
	let isFulfiller = $state(data.isFulfiller ?? false)
	let isSuperAdmin = $state(data.isSuperAdmin ?? false)
	let isShopManager = $state(data.isShopManager ?? false)

	let slackId = $state(data.slackId ?? "")
	let nda = $state(data.nda ?? false)
	let loading = $state(false)
	const handleSaveChanges = () => {
		// Admin login matches on Slack ID, so it is required (the server enforces this too)
		if (!SLACK_USER_ID_PATTERN.test(slackId.trim())) {
			alert("Enter this person's Slack user ID (it starts with U, e.g. U01ABCDEF).")
			return
		}
		loading = true
		const updatedUser = {
			email: data.email,
			isReviewer,
			isT2Reviewer,
			isFulfiller,
			isSuperAdmin,
			isShopManager,
			slackId,
			nda,
		}
		const response = fetch("/admin/super-admin/updateAdmin", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(updatedUser),
			credentials: "include",
		})
		response
			.then(async res => {
				if (res.ok) {
					alert("User updated successfully!")
				} else {
					const body = await res.json().catch(() => null)
					alert(`Failed to update user${body?.error ? `: ${body.error}` : "."}`)
				}
			})
			.catch(() => {
				alert("An error occurred while updating the user.")
			})
		loading = false
	}
</script>

<main class="flex h-full w-full flex-col overflow-hidden text-primary-foreground">
	<div class="flex-none px-6 pt-8 pb-4">
		<div class="mb-5 flex items-center justify-between p-2">
			<div class="flex items-center gap-3">
				<a
					href="/admin/super-admin/"
					class="rounded-xl border border-white/10 bg-white/5 p-2 transition hover:bg-white/10">
					<ArrowLeft class="size-5" />
				</a>

				<div>
					<p class="text-sm text-zinc-400">Manage User</p>
					<h1 class="text-3xl font-bold tracking-tight">{data.slackName}</h1>
				</div>
			</div>

			<div class="flex items-center justify-between gap-x-3 border-l-2 pl-2">
				<div>
					<p class="font-medium">Slack ID</p>
					<p class="text-sm text-zinc-400">User's Slack ID (Use /se info)</p>
				</div>

				<Input bind:value={slackId} class="w-60" />
			</div>
		</div>

		<div class="border-b-2 px-6 py-2">
			<h2 class="text-xl font-semibold">Roles & Permissions</h2>
			<p class="text-sm text-zinc-400">Control what this user can access.</p>
		</div>
	</div>

	<section class="min-h-0 flex-1 px-6 pb-4">
		<div class=" grid grid-cols-2 gap-x-2 gap-y-2 overflow-y-auto rounded-xl p-2">
			<div class="flex items-center justify-between rounded-2xl px-4 py-3 transition hover:bg-white/5">
				<div>
					<p class="font-medium">T1 Reviewer</p>
					<p class="text-sm text-zinc-400">Can review tier 1 submissions</p>
				</div>

				<Switch bind:checked={isReviewer} />
			</div>

			<div class="flex items-center justify-between rounded-2xl px-4 py-3 transition hover:bg-white/5">
				<div>
					<p class="font-medium">T2 Reviewer</p>
					<p class="text-sm text-zinc-400">Can review tier 2 submittions</p>
				</div>

				<Switch bind:checked={isT2Reviewer} />
			</div>

			<div class="flex items-center justify-between rounded-2xl px-4 py-3 transition hover:bg-white/5">
				<div>
					<p class="font-medium">Fulfillment</p>
					<p class="text-sm text-zinc-400">Handles fulfillment</p>
				</div>

				<Switch bind:checked={isFulfiller} />
			</div>

			<div class="flex items-center justify-between rounded-2xl px-4 py-3 transition hover:bg-white/5">
				<div>
					<p class="font-medium">Super Admin</p>
					<p class="text-sm text-zinc-400">Full access</p>
				</div>

				<Switch bind:checked={isSuperAdmin} />
			</div>
			<div class="flex items-center justify-between rounded-2xl px-4 py-3 transition hover:bg-white/5">
				<div>
					<p class="font-medium">Shop Manager</p>
					<p class="text-sm text-zinc-400">Can manage shop items</p>
				</div>

				<Switch bind:checked={isShopManager} />
			</div>
			<div class="flex items-center justify-between rounded-2xl px-4 py-3 transition hover:bg-white/5">
				<div>
					<p class="font-medium">NDA'ed</p>
					<p class="text-sm text-zinc-400">Has signed NDA?</p>
				</div>

				<Switch bind:checked={nda} />
			</div>
		</div>
	</section>

	<div class="flex flex-none justify-start border-t border-white/10 bg-zinc-950/10 px-8 py-4">
		<Button
			class="rounded-xl bg-primary px-6 py-5 text-sm font-semibold text-primary-foreground transition hover:scale-104 hover:opacity-90"
			onclick={() => handleSaveChanges()}>
			{#if loading}
				<div class="loader mx-auto h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-white"></div>
			{/if}
			Save Changes
		</Button>
	</div>
</main>
