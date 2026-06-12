<script lang="ts">
	import { ArrowUpRight } from "@lucide/svelte"
	import type { Log } from "$lib/types"
	let { data } = $props()
	let project = data.project
	const calculateTotalHours = (log: Log[]) => {
		return log.reduce((total, entry) => {
			return total + entry.deltaTime
		}, 0)
	}
	let log = JSON.parse(project.log) as Log[]
	log.reverse()
    let currentReview = $state({
        message: "",
        justification: "",
        internalNote: "",
        reviewerName: ""
    })
    const changeReview = (userExternal: string, justification: string, internalNote: string, reviewerName: string) => {

        currentReview.message = userExternal
        currentReview.justification = justification
        currentReview.internalNote = internalNote
        currentReview.reviewerName = reviewerName
    }
</script>

<div class="center flex items-center justify-center w-screen h-screen">
	<div
		class="h-[90vh] border border-zinc-800 rounded-2xl"
		style="width:90vw;   backdrop-filter: blur(10px);"
	>
		<div
			class="w-full h-[20%] border-b border-zinc-800 flex items-center justify-between px-5"
		>
			<div class="project-details py-2 px-3 w-1/3">
				<h1 class="font-alchemize text-[clamp(1.25rem,2.15vw,1.75rem)]">
					{project.Name}
				</h1>
				<h3
					class="hours font-alchemize text-[clamp(0.5rem,1vw,1rem)] text-neutral-300"
				>
					{calculateTotalHours(log)} hour{calculateTotalHours(log) !== 1
						? "s"
						: ""}, Update: {project.update ? "Yes" : "No"}
				</h3>
				<p
					class="description text-neutral-500 text-[clamp(0.5rem,1vw,1rem)] text-justify line-clamp-4 overflow-hidden"
				>
					{project.description}
				</p>
			</div>
			<img src={project.screenshot} alt="" class="screenshot max-h-9/10" />
		</div>
		<div class="flex  h-[80%]">
            <div
			class="nested-timeLine w-1/2 border flex flex-col px-3 py-3 gap-2 overflow-scroll"
		>
			{#each log as entry, j}
				{#each [...entry.message].reverse() as message,i }
					{#if message.reviewerName != "user"}
                        <button class="nest w text-white text-left" onclick={() => changeReview(message.userExternal, message.justification, message.internalNote, message.reviewerName || "unknown reviewer")}>
						<div
							class="t2  bg-zinc-900 h-30 border-l-4 {i ===
											0
												? entry.status === 1
													? 'border-l-green-700'
													: 'border-l-red-700'
												: 'border-l-red-700'} px-3 relative"
						>
							<h2 class="mb-1">{message.userExternal}</h2>
							<p class="text-sm text-neutral-400 line-clamp-3">
								{message.justification}
							</p>
							<p class="by text-sm text-neutral-400 absolute bottom-2">
								By: {message.reviewerName}
							</p>
							<div
								class="click flex absolute bottom-2 right-5 items-center text-sm"
							>
								<ArrowUpRight class="size-5 opacity-80" />
								To view
							</div>
						</div>
					</button>
                    {:else}
                    <button class="nest w text-white text-left" onclick={() => changeReview(message.userExternal, message.justification, message.internalNote, message.reviewerName || "unknown reviewer")}>
                        <div
                            class="t2 w- bg-zinc-900 h-30 border-l-4 border-yellow-700 px-3 relative"
                        >
                            <h2 class="mb-1">Ship By User</h2>
                            <p class="text-sm text-neutral-400">Changelog"{message.userExternal}</p>
                            <p class="by text-sm text-neutral-400 absolute bottom-2">
                                By: {message.reviewerName}
                            </p>
                            <div
                                class="click flex absolute bottom-2 right-5 items-center text-sm"
                            >
                                <ArrowUpRight class="size-5 opacity-80" />
                                To view
                            </div>
                        </div>
                    </button>
                    {/if}
				{/each}
			{/each}
		</div>
        <div class="moreInfo py-2 px-4">
            User Note
            <p class="text-sm text-neutral-400 line-clamp-3">
                {currentReview.message}
            </p>
            <br/>
            Internal Note
            <p class="text-sm text-neutral-400 line-clamp-3 ">
            {currentReview.internalNote}
            </p>
            <br/>
            Justification
            <p class="text-sm text-neutral-400 whitespace-pre-line">
            {currentReview.justification}
            </p>
            <br/>
            by: {currentReview.reviewerName}
        </div>
        </div>
	</div>
</div>
