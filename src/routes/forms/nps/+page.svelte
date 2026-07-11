<script lang="ts">
	let score: number | null = null
	let slack = ""
	let heardFrom = ""
	let wentWell = ""
	let couldImprove = ""
	let anythingElse = ""
	let submitted = false

	const scores = Array.from({ length: 11 }, (_, i) => i)

	async function submit() {
		const tempFormData = new FormData()
		tempFormData.append("score", score?.toString() ?? "")
		tempFormData.append("slack", slack)
		tempFormData.append("hear", heardFrom)
		tempFormData.append("well", wentWell)
		tempFormData.append("better", couldImprove)
		tempFormData.append("else", anythingElse)
		const response = await fetch("/forms/nps", {
			method: "POST",
			body: tempFormData,
		})

		const result = await response.json()
		console.log(result)

		submitted = true
	}
</script>

<svelte:head>
	<title>Was Alchemize Good?</title>
</svelte:head>

<div
	class="fixed inset-0 -z-20 bg-[url('/alchbg.png')] bg-cover bg-center blur-xl"
></div>
<div class="fixed inset-0 -z-10 bg-black/90"></div>

<div class="min-h-screen w-full flex items-center justify-center px-6 py-12">
	<div
		class="w-full rounded-3xl bg-black/60 p-8 pt-4 shadow-2xl backdrop-blur-xl sm:p-12"
	>
		<p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
			Feedback
		</p>

		<h1
			class="font-alchemize mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl"
		>
			Was Alchemize Good?
		</h1>

		<p class="mt-4 text-sm leading-relaxed text-zinc-400">
			We read every response, it's how we make the next run better. Even if you
			leave your Slack ID or Username, no one outside the two of us will ever
			see who said what. Be honest.
		</p>
		<p class="mt-2 text-xs text-zinc-600">— TheUtkarsh8939 &amp; Coolcream</p>

		{#if submitted}
			<div
				class="mt-10 rounded-2xl bg-black px-20 text-center flex items-center flex-col justify-center"
				style="height:200px;"
			>
				<p class="font-alchemize text-lg font-semibold text-white">
					Thanks for that.
				</p>
				<p class="mt-1 text-sm text-zinc-400">
					Your feedback's in. We genuinely appreciate it.
				</p>
			</div>
		{:else}
			<form
				class="mt-10 space-y-9 flex flex-col gap-10"
				on:submit|preventDefault={submit}
			>
				<div>
					<div class="mb-4 flex items-baseline gap-2">
						<span class="text-xs font-semibold text-primary">01</span>
						<p class="text-sm font-medium text-zinc-300">
							How likely are you to recommend Alchemize?
						</p>
					</div>

					<div class="flex flex-wrap gap-2">
						{#each scores as n}
							<button
								type="button"
								on:click={() => (score = n)}
								aria-pressed={score === n}
								style="height:40px;width:40px"
								class={`flex  aspect-square  shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-all duration-150
								${
									score === n
										? "scale-110 border-primary bg-primary text-black shadow-lg shadow-primary/30"
										: "border-zinc-800 bg-zinc-950/70 text-zinc-400 hover:-translate-y-0.5 hover:border-primary/60 hover:text-white"
								}`}
							>
								{n}
							</button>
						{/each}
					</div>

					<div class="mt-2 flex justify-between text-xs text-zinc-600">
						<span>Not likely</span>
						<span>Extremely likely</span>
					</div>
				</div>

				<div>
					<div class="mb-2 flex items-baseline gap-2">
						<span class="text-xs font-semibold text-primary">02</span>
						<label for="heard" class="text-sm font-medium text-zinc-300">
							Where did you hear about us?
						</label>
					</div>

					<input
						id="heard"
						bind:value={heardFrom}
						placeholder="A friend, Slack, Site or something else..."
						class="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition focus:border-primary"
					/>
				</div>

				<div>
					<div class="mb-2 flex items-baseline gap-2">
						<span class="text-xs font-semibold text-primary">03</span>
						<label for="well" class="text-sm font-medium text-zinc-300">
							What did we do well?
						</label>
					</div>

					<textarea
						id="well"
						bind:value={wentWell}
						rows="3"
						placeholder="The stuff worth keeping..."
						class="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition focus:border-primary"
					/>
				</div>

				<div>
					<div class="mb-2 flex items-baseline gap-2">
						<span class="text-xs font-semibold text-primary">04</span>
						<label for="improve" class="text-sm font-medium text-zinc-300">
							What can we do better?
						</label>
					</div>

					<textarea
						id="improve"
						bind:value={couldImprove}
						rows="3"
						placeholder="Don't hold back..."
						class="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition focus:border-primary"
					/>
				</div>

				<div>
					<div class="mb-2 flex items-baseline gap-2">
						<span class="text-xs font-semibold text-primary">05</span>
						<label for="else" class="text-sm font-medium text-zinc-300">
							Anything else?
						</label>
					</div>

					<textarea
						id="else"
						bind:value={anythingElse}
						rows="3"
						placeholder="Anything we didn't ask..."
						class="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition focus:border-primary"
					/>
				</div>

				<div>
					<div class="mb-2 flex items-baseline gap-2">
						<span class="text-xs font-semibold text-primary">06</span>
						<label for="slack" class="text-sm font-medium text-zinc-300">
							Slack ID/Username <span class="text-zinc-600">(optional)</span>
						</label>
					</div>

					<input
						id="slack"
						bind:value={slack}
						placeholder="@username"
						class="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition focus:border-primary"
					/>
				</div>

				<button
					type="submit"
					disabled={score === null}
					class="w-full rounded-full bg-primary py-3 font-semibold text-black transition
					enabled:hover:scale-[1.02] enabled:hover:shadow-lg enabled:hover:shadow-primary/30 enabled:active:scale-95
					disabled:cursor-not-allowed disabled:opacity-40"
				>
					Submit Feedback
				</button>
			</form>
		{/if}
	</div>
</div>
