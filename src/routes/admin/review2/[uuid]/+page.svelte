<script lang="ts">
	import { ArrowUpRight } from "@lucide/svelte"
	import type { Log } from "$lib/types"
	import { totalLogMinutes } from "$lib/reviewTools"
	let { data } = $props()
	const project = data.project
	const log = JSON.parse(project.log) as Log[]
	log.reverse()
	const currentReview = $state({
		message: "",
		justification: "",
		internalNote: "",
		reviewerName: "",
	})
	const changeReview = (userExternal: string, justification: string, internalNote: string, reviewerName: string) => {
		currentReview.message = userExternal
		currentReview.justification = justification
		currentReview.internalNote = internalNote
		currentReview.reviewerName = reviewerName
	}
</script>

<div class="center flex h-screen w-screen items-center justify-center">
	<div class="h-[90vh] rounded-2xl border border-zinc-800" style="width:90vw;   backdrop-filter: blur(10px);">
		<div class="flex h-[20%] w-full items-center justify-between border-b border-zinc-800 px-5">
			<div class="project-details w-1/3 px-3 py-2">
				<h1 class="font-alchemize text-[clamp(1.25rem,2.15vw,1.75rem)]">
					{project.Name}
				</h1>
				<h3 class="hours font-alchemize text-[clamp(0.5rem,1vw,1rem)] text-neutral-300">
					{totalLogMinutes(log)} hour{totalLogMinutes(log) !== 1 ? "s" : ""}, Update: {project.update ? "Yes" : "No"}
				</h3>
				<p class="description line-clamp-4 overflow-hidden text-justify text-[clamp(0.5rem,1vw,1rem)] text-neutral-500">
					{project.description}
				</p>
			</div>
			<img src={project.screenshot} alt="" class="screenshot max-h-9/10" />
		</div>
		<div class="flex h-[80%]">
			<div class="nested-timeLine flex w-1/2 flex-col gap-2 overflow-scroll border px-3 py-3">
				<!-- eslint-disable-next-line svelte/require-each-key -- log entries and their messages have no id -->
				{#each log as entry}
					<!-- eslint-disable-next-line svelte/require-each-key -- log entries and their messages have no id -->
					{#each [...entry.message].reverse() as message, i}
						{#if message.reviewerName !== "user"}
							<button
								class="nest w text-left text-primary-foreground"
								onclick={() =>
									changeReview(
										message.userExternal,
										message.justification,
										message.internalNote,
										message.reviewerName || "unknown reviewer"
									)}>
								<div
									class="t2 h-30 border-l-4 bg-zinc-900 {i === 0
										? entry.status === 1
											? 'border-l-green-700'
											: 'border-l-red-700'
										: 'border-l-red-700'} relative px-3">
									<h2 class="mb-1">{message.userExternal}</h2>
									<p class="line-clamp-3 text-sm text-neutral-400">
										{message.justification}
									</p>
									<p class="by absolute bottom-2 text-sm text-neutral-400">
										By: {message.reviewerName}
									</p>
									<div class="click absolute right-5 bottom-2 flex items-center text-sm">
										<ArrowUpRight class="size-5 opacity-80" />
										To view
									</div>
								</div>
							</button>
						{:else}
							<button
								class="nest w text-left text-primary-foreground"
								onclick={() =>
									changeReview(
										message.userExternal,
										message.justification,
										message.internalNote,
										message.reviewerName || "unknown reviewer"
									)}>
								<div class="t2 w- relative h-30 border-l-4 border-yellow-700 bg-zinc-900 px-3">
									<h2 class="mb-1">Ship By User</h2>
									<p class="text-sm text-neutral-400">
										Changelog"{message.userExternal}
									</p>
									<p class="by absolute bottom-2 text-sm text-neutral-400">
										By: {message.reviewerName}
									</p>
									<div class="click absolute right-5 bottom-2 flex items-center text-sm">
										<ArrowUpRight class="size-5 opacity-80" />
										To view
									</div>
								</div>
							</button>
						{/if}
					{/each}
				{/each}
			</div>
			<div class="moreInfo px-4 py-2">
				User Note
				<p class="line-clamp-3 text-sm text-neutral-400">
					{currentReview.message}
				</p>
				<br />
				Internal Note
				<p class="line-clamp-3 text-sm text-neutral-400">
					{currentReview.internalNote}
				</p>
				<br />
				Justification
				<p class="text-sm whitespace-pre-line text-neutral-400">
					{currentReview.justification}
				</p>
				<br />
				by: {currentReview.reviewerName}
			</div>
		</div>
	</div>
</div>
