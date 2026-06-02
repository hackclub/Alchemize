<script lang="ts">
	import ProjectDetailsDialog from "$lib/components/projectdetails-dialog.svelte"
	import Button from "$lib/components/ui/button/button.svelte"
	import Input from "$lib/components/ui/input/input.svelte"
	import Textarea from "$lib/components/ui/textarea/textarea.svelte"
	import type { Project } from "$lib/types"
	let detailsOpen = $state(false)

	let project = $state({} as Project)
</script>

<main class="w-screen h-screen">
	<div class="fixed inset-0 bg-black/20 -z-10"></div>
	<div
		class="relative z-50 p-5 h-full w-full flex items-start justify-start gap-x-5"
	>
		<aside
			class="sidebar w-1/4 h-full rounded-2xl bg-black/20 border-2 overflow-y-auto p-2"
		>
			<button
				class="project w-full border-b h-20 p-2 hover:bg-background rounded-t-2xl"
			>
				<h1 class="text-xl font-bold w-full flex items-center h-10 px-2">
					Project
				</h1>
				<div class="flex px-2 gap-4 items-end h-6">
					<h2 class="creator text-sm text-gray-500">SlackId</h2>
					<div class="theme text-xs">Theme</div>
				</div>
			</button>
		</aside>
		<div
			class="w-full max-h-full h-full flex flex-col items-center justify-start gap-y-5"
		>
			<nav class="top-bar flex bg-transparent gap-16 text-white">
				<button
					class="button w-34 bg-yellow-900 flex items-center justify-center py-2 rounded-full"
				>
					Pending (20)
				</button>

				<button
					class="button w-34 bg-red-900 flex items-center justify-center py-2 rounded-full"
				>
					Rejected (5)
				</button>

				<button
					class="button w-34 bg-green-900 flex items-center justify-center py-2 rounded-full"
				>
					Approved (15)
				</button>

				<button
					class="button w-34 bg-blue-900 flex items-center justify-center py-2 rounded-full"
				>
					Total (40)
				</button>
			</nav>
			<div
				class="w-full h-full overflow-y-auto bg-background/40 border-2 rounded-2xl flex flex-col items-center justify-start gap-y-3 p-2"
			>
				<div class="details w-full">
					<div class="top-sect w-full p-1 flex items-center justify-between">
						<div class="text flex flex-col items-start justify-start gap-y-1">
							<div class="flex items-center gap-x-2">
								<h1 class="text-2xl text-admin-text font-bold">
									Project: (5hrs)
								</h1>
								<Button
									onclick={() => (detailsOpen = true)}
									class="bg-admin-primary"
								>
									Details
								</Button>
							</div>
							<p class="text-xs text-muted-foreground">
								Submitted by: coolcream, Type: Type, Category: category
							</p>
						</div>
						<div class="links flex items-center justify-center gap-x-5">
							<a
								href={"/"}
								class="hover:scale-104 transition px-2 py-0.5 bg-admin-primary/30 rounded-md cursor-pointer"
								target="_blank"
							>
								Demo
							</a>
							<a
								href={"/"}
								class="hover:scale-104 transition px-2 py-0.5 bg-admin-primary/30 rounded-md cursor-pointer"
								target="_blank"
							>
								Repo
							</a>
							<a
								href={"/"}
								class="hover:scale-104 transition px-2 py-0.5 bg-admin-primary/30 rounded-md cursor-pointer"
								target="_blank"
							>
								Readme
							</a>
						</div>
					</div>
				</div>
				<div class="max-h-full w-full overflow-y-auto flex gap-x-3">
					<div class="flex flex-col gap-y-5 max-h-full w-[50%] p-2">
						<div class="flex flex-col items-start justify-start gap-y-1 w-full">
							<h2 class="text-muted-foreground">What is this project about?</h2>
							<Textarea
								class="resize-none h-24 overflow-y-auto	"
								placeholder="This project is about..."
							/>
						</div>
						<div class="flex flex-col items-start justify-start gap-y-1 w-full">
							<h2 class="text-muted-foreground text-sm">
								How many git commits are there? Are they detailed enough? Do you
								think they match the logged amount of hours?
							</h2>
							<Textarea
								class="resize-none h-45 overflow-y-auto	"
								placeholder="There are 18 commits for 12 hours logged... I think they are detailed enough..."
							/>
						</div>
					</div>
					<div class="flex flex-col gap-y-5 h-full">
						<div class="flex flex-col items-start justify-start gap-y-1 w-full">
							<h2 class="text-muted-foreground text-sm">
								If this project was submitted before, what are the changes in
								this submission?
							</h2>
							<Textarea
								class="resize-none h-32 overflow-y-auto	"
								placeholder="The changes are..."
							/>
						</div>
						<div
							class="flex flex-col items-start justify-start gap-y-1 w-full mt-2"
						>
							<div class="flex items-center justify-between w-full">
								<h2 class="text-muted-foreground text-lg">
									Override hours (optional)
								</h2>
								<Input class="w-[20%]" type="number" value={2} min="0" />
							</div>
							<Textarea
								class="resize-none overflow-y-auto h-35"
								placeholder="Reason for overriding..."
							/>
						</div>
					</div>
				</div>
				<div class="w-full flex flex-col gap-y-2 p-2">
					<h2 class="text-muted-foreground text-sm">
						Autogenerated justification:
					</h2>
					<Textarea
						class="resize-none overflow-y-auto h-24"
						readonly
						value="This project is about....There are ___ commits.....The commits are detailed....20 minuted were cut...."
					/>
				</div>
			</div>
		</div>
	</div>
</main>

<ProjectDetailsDialog bind:open={detailsOpen} {project} />
