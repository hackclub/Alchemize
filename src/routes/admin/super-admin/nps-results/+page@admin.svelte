<script lang="ts">
	const { data } = $props()
	type NpsRow = {
		id: number
		slackId: string
		data: { score: number; hear: string; well: string; better: string; anythingElse: string }
	}
	const results = (data.npsResults.results as NpsRow[]).map(result => ({
		id: result.id,
		score: result.data.score,
		slackId: result.slackId,
		headFrom: result.data.hear,
		wentWell: result.data.well,
		couldImprove: result.data.better,
		anythingElse: result.data.anythingElse,
	}))
</script>

<main class="h-screen w-full p-5">
	<div class="flex h-full w-full flex-col gap-5 rounded-xl border-2 bg-black/40 p-8">
		<div class="flex flex-col gap-y-2">
			<h1 class="text-2xl font-bold tracking-tight">NPS Results:</h1>
			<p class="text-sm text-zinc-400">View the feedback by the people</p>
		</div>

		<div class="container grid h-full max-h-full min-w-full grid-cols-4 gap-4 overflow-auto p-4">
			{#each results as result (result.id)}
				<div
					class="card h-[35vh] max-h-[35vh] w-full space-y-2 overflow-auto rounded-xl border border-primary bg-primary/10 p-3 backdrop-blur-xl">
					<h2 class="font-mono text-xl text-zinc-200">
						Score: <span class="text-blue-800">{result.score}</span>
					</h2>

					<p class="text-xs text-primary">By: {result.slackId}</p>
					<p class="max-w-full text-xs wrap-break-word">
						Heard from:
						<span class="text-blue-800">{result.headFrom}</span>
					</p>
					<p class="max-w-full text-xs wrap-break-word">
						What went well:
						<span class="text-blue-800">{result.wentWell}</span>
					</p>
					<p class="max-w-full text-xs wrap-break-word">
						Could Improve:
						<span class="text-blue-800">{result.couldImprove}</span>
					</p>
					<p class="max-w-full text-xs wrap-break-word">
						Anything else:
						<span class="text-blue-800">{result.anythingElse}</span>
					</p>
				</div>
			{/each}
		</div>
	</div>
</main>
