<script lang="ts">
	import { deserialize } from "$app/forms"
	let score: number | null = null
	let slack = ""
	let heardFrom = ""
	let wentWell = ""
	let couldImprove = ""
	let anythingElse = ""
	let submitted = false
	let submitting = false
	let errorMessage = ""

	const checkAllFilled = () => {
		return score === null || heardFrom.trim() === "" || wentWell.trim() === "" || couldImprove.trim() === ""
	}

	const scores = Array.from({ length: 11 }, (_, i) => i)

	async function submit() {
		const tempFormData = new FormData()
		tempFormData.append("score", score?.toString() ?? "")
		tempFormData.append("slack", slack)
		tempFormData.append("hear", heardFrom)
		tempFormData.append("well", wentWell)
		tempFormData.append("better", couldImprove)
		tempFormData.append("else", anythingElse)
		submitting = true
		errorMessage = ""
		try {
			// x-sveltekit-action makes SvelteKit answer with an ActionResult instead of a rendered page
			const response = await fetch("/forms/nps", {
				method: "POST",
				body: tempFormData,
				headers: { "x-sveltekit-action": "true" },
			})
			const result = deserialize(await response.text())
			if (result.type === "success") {
				submitted = true
			} else if (result.type === "failure") {
				errorMessage = (result.data?.message as string | undefined) ?? "Something went wrong, please try again."
			} else {
				errorMessage = "Something went wrong, please try again."
			}
		} catch {
			errorMessage = "Could not reach the server, please try again."
		} finally {
			submitting = false
		}
	}
</script>

<svelte:head>
	<title>Was Alchemize Good?</title>
</svelte:head>

<div class="fixed inset-0 -z-20 bg-[url('/alchbg.png')] bg-cover bg-center blur-xl"></div>
<div class="fixed inset-0 -z-10 bg-black/50"></div>

<div class="flex min-h-screen w-full items-center justify-center px-6 py-5">
	<div class="w-full rounded-3xl bg-black/60 p-8 pt-4 shadow-2xl backdrop-blur-xl sm:p-12">
		<p class="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Feedback</p>

		<h1 class="mt-3 font-alchemize text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
			Is Alchemize Good?
		</h1>

		<p class="mt-4 text-sm leading-relaxed text-zinc-400">
			We read every response, it's how we make the next run better. Even if you leave your Slack ID or Username, no one
			outside the two of us will ever see who said what. Be honest.
		</p>
		<p class="mt-2 text-xs text-zinc-600">— TheUtkarsh8939 &amp; Coolcream</p>

		{#if submitted}
			<div
				class="mt-10 flex flex-col items-center justify-center rounded-2xl bg-black px-20 text-center"
				style="height:200px;">
				<p class="font-alchemize text-lg font-semibold text-primary-foreground">Thanks for that.</p>
				<p class="mt-1 text-sm text-zinc-400">Your feedback's in. We genuinely appreciate it.</p>
			</div>
		{:else}
			<form class="mt-10 flex flex-col gap-10 space-y-9" on:submit|preventDefault={submit}>
				<div>
					<div class="mb-4 flex items-baseline gap-2">
						<span class="text-xs font-semibold text-primary">01</span>
						<p class="text-sm font-medium text-zinc-300">How likely are you to recommend Alchemize?</p>
					</div>

					<div class="flex flex-wrap gap-2">
						{#each scores as n (n)}
							<button
								type="button"
								on:click={() => (score = n)}
								aria-pressed={score === n}
								style="height:40px;width:40px"
								class={`flex  aspect-square  shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-all duration-150
								${
									score === n
										? "scale-110 border-primary bg-primary text-black shadow-lg shadow-primary/30"
										: "border-zinc-800 bg-zinc-950/70 text-zinc-400 hover:-translate-y-0.5 hover:border-primary/60 hover:text-primary-foreground"
								}`}>
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
						<label for="heard" class="text-sm font-medium text-zinc-300"> Where did you hear about us? </label>
					</div>

					<input
						id="heard"
						bind:value={heardFrom}
						maxlength="2000"
						placeholder="A friend, Slack, Site or something else..."
						class="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-primary-foreground transition outline-none placeholder:text-zinc-600 focus:border-primary" />
				</div>

				<div>
					<div class="mb-2 flex items-baseline gap-2">
						<span class="text-xs font-semibold text-primary">03</span>
						<label for="well" class="text-sm font-medium text-zinc-300"> What did we do well? </label>
					</div>

					<textarea
						id="well"
						bind:value={wentWell}
						maxlength="2000"
						rows="3"
						placeholder="The stuff worth keeping..."
						class="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-primary-foreground transition outline-none placeholder:text-zinc-600 focus:border-primary"
					></textarea>
				</div>

				<div>
					<div class="mb-2 flex items-baseline gap-2">
						<span class="text-xs font-semibold text-primary">04</span>
						<label for="improve" class="text-sm font-medium text-zinc-300"> What can we do better? </label>
					</div>

					<textarea
						id="improve"
						bind:value={couldImprove}
						maxlength="2000"
						rows="3"
						placeholder="Don't hold back..."
						class="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-primary-foreground transition outline-none placeholder:text-zinc-600 focus:border-primary"
					></textarea>
				</div>

				<div>
					<div class="mb-2 flex items-baseline gap-2">
						<span class="text-xs font-semibold text-primary">05</span>
						<label for="else" class="text-sm font-medium text-zinc-300"> Anything else? </label>
					</div>

					<textarea
						id="else"
						bind:value={anythingElse}
						maxlength="2000"
						rows="3"
						placeholder="Anything we didn't ask..."
						class="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-primary-foreground transition outline-none placeholder:text-zinc-600 focus:border-primary"
					></textarea>
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
						maxlength="80"
						placeholder="@username"
						class="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-primary-foreground transition outline-none placeholder:text-zinc-600 focus:border-primary" />
				</div>

				{#if errorMessage}
					<p class="text-sm text-red-400" role="alert">{errorMessage}</p>
				{/if}

				<button
					type="submit"
					disabled={checkAllFilled() || submitting}
					class="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground transition
					enabled:hover:scale-[1.02] enabled:hover:shadow-lg enabled:hover:shadow-primary/30 enabled:active:scale-95
					disabled:cursor-not-allowed disabled:opacity-40">
					Submit Feedback
				</button>
			</form>
		{/if}
	</div>
</div>
