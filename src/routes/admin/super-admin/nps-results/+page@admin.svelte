<script lang="ts">

	const {data} = $props();
	const res = data.npsResults.results;
	console.log(res)
	let results: any[] = []
	res.forEach((result: any) => {
		results.push({
			score: result.data.score,
			slackId: result.slackId,
			headFrom: result.data.hear,
			wentWell: result.data.well,
			couldImprove: result.data.better,
			anythingElse: result.data.anythingElse,
		});
	});
</script>

<main class="h-screen w-full p-5">
	<div
		class="h-full w-full rounded-xl bg-black/40 border-2 p-8 flex gap-5 flex-col"
	>
		<div class="flex flex-col gap-y-2">
			<h1 class="text-2xl font-bold tracking-tight">NPS Results:</h1>
			<p class="text-sm text-zinc-400">View the feedback by the people</p>
		</div>

		<div
			class="container min-w-full h-full max-h-full overflow-auto gap-4 grid grid-cols-4 p-4"
		>
			{#each results as result}
				<div
					class="card border border-admin-primary rounded-xl p-3 bg-admin-primary/10 backdrop-blur-xl overflow-auto max-h-[35vh] h-[35vh] w-full space-y-2"
				>
					<h2 class="text-xl text-zinc-200 font-mono">
						Score: <span class="text-blue-800">{result.score}</span>
					</h2>

					<p class="text-xs text-admin-text">By: {result.slackId}</p>
					<p class="text-xs max-w-full wrap-break-word">
						Heard from:
						<span class="text-blue-800">{result.headFrom}</span>
					</p>
					<p class="text-xs max-w-full wrap-break-word">
						What went well:
						<span class="text-blue-800">{result.wentWell}</span>
					</p>
					<p class="text-xs max-w-full wrap-break-word">
						Could Improve:
						<span class="text-blue-800">{result.couldImprove}</span>
					</p>
					<p class="text-xs max-w-full wrap-break-word">
						Anything else:
						<span class="text-blue-800">{result.anythingElse}</span>
					</p>
				</div>
			{/each}
		</div>
	</div>
</main>
