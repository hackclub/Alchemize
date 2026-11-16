<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog"

	type Project = {
		name: string
		hours: number
		submittedBy: string
		type: string
		category: string
		description: string
		screenshot?: string
		screenshot2?: string
	}

	let {
		open = $bindable(false),
		project = {
			name: "Demo Project",
			hours: 4,
			submittedBy: "coolcream",
			type: "software",
			category: "Tribute",
			description: "This is a demo project description. Soon this will be dynamic.",
			screenshot: "/path/to/screenshot.jpg",
			screenshot2: "/path/to/screenshot2.jpg",
		},
	}: {
		open: boolean
		project: Project
	} = $props()
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="min-w-[60vw]">
		<Dialog.Header>
			<Dialog.Title class="text-2xl font-bold text-primary">{project.name} ({project.hours}hrs)</Dialog.Title>

			<Dialog.Description class="text-muted-foreground">
				{project.submittedBy} • {project.type} • {project.category}
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-2">
			<div>
				<h2 class="font-semibold text-primary">Description</h2>
				<p class="max-w-[54vw] overflow-hidden wrap-break-word text-muted-foreground">
					{project.description}
				</p>
			</div>
		</div>
		<div class="screenshots flex w-[60vw] gap-4">
			<img src={project.screenshot} alt="" class="h-auto w-[45%] rounded-xl border-2 border-primary object-contain" />
			<img src={project.screenshot2} alt="" class="h-auto w-[45%] rounded-xl border-2 border-primary object-contain" />
		</div>
	</Dialog.Content>
</Dialog.Root>
