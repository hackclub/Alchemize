<script>
	import Button from "$lib/components/ui/button/button.svelte"
	import Input from "$lib/components/ui/input/input.svelte"
	import { FlaskConical } from "lucide-svelte"
	import { currenciesToPotionMix } from "$lib/utils"
	import { invalidateAll } from "$app/navigation"
	let { data } = $props()
	let redstoneAmount = $state(0)
	let glowstoneAmount = $state(0)
	let aquaRegiaAmount = $state(0)
	let potionMixAmount = $state(0)
	let hasRedstone = $state(data.currencies?.redstone)
	let hasGlowstone = $state(data.currencies?.glowstone)
	let hasAquaRegia = $state(data.currencies?.aqua_regia)
	let hasPotionMix = $state(data.currencies?.potion_mix)
	const calculatePotionMix = () => {
		potionMixAmount = currenciesToPotionMix(
			redstoneAmount,
			glowstoneAmount,
			aquaRegiaAmount
		)
	}
	let loading = $state(false)
	const updatePotionMix = async () => {
		loading = true
		const res = await fetch("/dashboard/trade/trade", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				redstone: redstoneAmount,
				glowstone: glowstoneAmount,
				aqua_regia: aquaRegiaAmount,
			}),
		})
		if (res.ok) {
			invalidateAll()
			const resData = await res.json()
			data.currencies = resData.currencies
			if (hasPotionMix) {
				hasPotionMix += currenciesToPotionMix(
					redstoneAmount,
					glowstoneAmount,
					aquaRegiaAmount
				)
			}
			if (hasRedstone && hasGlowstone && hasAquaRegia) {
				hasRedstone -= redstoneAmount
				hasGlowstone -= glowstoneAmount
				hasAquaRegia -= aquaRegiaAmount
			}
			redstoneAmount = 0
			glowstoneAmount = 0
			aquaRegiaAmount = 0
			potionMixAmount = 0

			alert("Stones converted successfully!")
		} else {
			const errorData = await res.json()
			alert(errorData.message)
		}
		loading = false
	}
</script>

<main class="w-full h-screen bg-gradbg">
	<div class="fixed inset-0 bg-black/50 z-10"></div>
	<div
		class="relative h-full w-full p-5 items-center justify-center flex-col flex z-50 gap-y-5"
	>
		<h1
			class="trade-heading text-7xl font-alchemize text-primary tracking-wider"
		>
			<!-- i didnt know what to call it.... -->
			TRADE STATION
		</h1>
		<h2 class="text-muted-foreground uppercase text-sm">
			Convert your raw stones into potion mix
		</h2>
		<!-- the main 3 coulumn cont. -->
		<div class="w-[85%] h-[50%] grid grid-cols-3 gap-x-10">
			<!-- first card (leftmost) -->
			<div
				class="h-full w-full flex flex-col gap-y-2 items-start justify-start"
			>
				<h2 class="text-muted-foreground uppercase text-sm">Stones</h2>
				<!-- sub-cards container -->
				<div class="owned-stones grid grid-rows-3 gap-y-3 h-full w-full">
					<!-- stone-1's card -->
					<div
						class="px-4 py-3 bg-white/10 border-2 border-white/10 rounded-xl backdrop-blur-2xl flex items-center justify-between gap-x-4"
					>
						<img
							src="/alch-redstone.png"
							alt="Redstone"
							class="w-14 h-14 object-contain p-3 bg-red-600/20 border border-red-500/30 rounded-xl"
						/>
						<div class="w-full grid grid-rows-2">
							<div class="w-full flex items-baseline justify-between">
								<h2
									class="text-red-400 text-sm font-semibold uppercase tracking-wider"
								>
									Redstone
								</h2>
								<span class="text-neutral-400 text-xs font-medium">
									Owned: {hasRedstone ? data.currencies?.redstone : 0}
								</span>
							</div>
							<Input
								type="number"
								bind:value={redstoneAmount}
								oninput={calculatePotionMix}
								class="h-8 text-sm"
								max={hasRedstone ? data.currencies?.redstone : 0}
								min="0"
							/>
						</div>
					</div>

					<!-- stone-2's card -->
					<div
						class="px-4 py-3 bg-white/10 border-2 border-white/10 rounded-xl backdrop-blur-2xl flex items-center justify-between gap-x-4"
					>
						<img
							src="/alch-glowstone.png"
							alt="Glowstone"
							class="w-14 h-14 object-contain p-3 bg-yellow-600/20 border border-yellow-500/30 rounded-xl"
						/>
						<div class="w-full grid grid-rows-2">
							<div class="w-full flex items-baseline justify-between">
								<h2
									class="text-yellow-400 text-sm font-semibold uppercase tracking-wider"
								>
									Glowstone
								</h2>
								<span class="text-neutral-400 text-xs font-medium">
									Owned: {hasGlowstone ? data.currencies?.glowstone : 0}
								</span>
							</div>
							<Input
								type="number"
								bind:value={glowstoneAmount}
								oninput={calculatePotionMix}
								class="h-8 text-sm"
								max={hasGlowstone ? data.currencies?.glowstone : 0}
								min="0"
							/>
						</div>
					</div>

					<!-- stone-3's card -->
					<div
						class="px-4 py-3 bg-white/10 border-2 border-white/10 rounded-xl backdrop-blur-2xl flex items-center justify-between gap-x-4"
					>
						<img
							src="/alch-aquaregia.png"
							alt="Aqua Regia"
							class="w-14 h-14 object-contain p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl"
						/>
						<div class="w-full grid grid-rows-2">
							<div class="w-full flex items-baseline justify-between">
								<h2
									class="text-blue-400 text-sm font-semibold uppercase tracking-wider"
								>
									Aqua Regia
								</h2>
								<span class="text-neutral-400 text-xs font-medium">
									Owned: {hasAquaRegia ? data.currencies?.aqua_regia : 0}
								</span>
							</div>
							<Input
								type="number"
								bind:value={aquaRegiaAmount}
								oninput={calculatePotionMix}
								class="h-8 text-sm"
								max={hasAquaRegia ? data.currencies?.aqua_regia : 0}
								min="0"
							/>
						</div>
					</div>
				</div>
			</div>
			<!-- second card goes here -->
			<div class="h-full w-full flex flex-col items-center gap-y-6 py-15">
				<!-- just a small effect i liked hehe (this was the hardest phew) -->

				<div
					class="flask bg-black/50 rounded-full p-8 shadow-primary animate-pulse"
				>
					<FlaskConical class="h-20 w-20 text-primary " />
				</div>
				<div class="flex flex-col items-center justify-start gap-y-2">
					<Button
						onclick={updatePotionMix}
						class="px-10 py-6  font-alchemize shadow-black rounded-full text-xl hover:scale-102 transition"
					>
						{#if loading}
							<div
								class="loader border-gray-500 border-2 border-t-white rounded-full size-5 animate-spin"
							></div>
						{/if}
						<!-- sounds cool eh? -->
						Convert stones
					</Button>
				</div>
			</div>
			<!-- anyway, third card here -->
			<div
				class="max-h-full w-full flex flex-col gap-y-2 items-start justify-start"
			>
				<h2 class="text-muted-foreground uppercase text-sm">Result</h2>
				<div
					class="h-full w-full bg-white/10 border-2 rounded-2xl flex flex-col gap-y-4 items-center justify-between py-10 px-5"
				>
					<div
						class="bg-black/50 rounded-full p-5 w-30 border-2 border-primary flex items-center justify-center shadow-primary"
					>
						<img src="/Alchemize.png" alt="" class="h-20 text-primary" />
					</div>
					<!-- replicated the stone card but made a few chnages like center align -->
					<div class="w-full flex flex-col items-center justify-start gap-y-3">
						<h2
							class="text-red-900 text-shadow-md font-bold text-md uppercase tracking-wider"
						>
							Potion Mix
						</h2>
						<Input
							type="number"
							bind:value={potionMixAmount}
							class="h-8 text-sm"
							readonly
						/>
						<span class="text-neutral-400 text-xs font-medium">
							Owned: {hasPotionMix ? data.currencies?.potion_mix : 0}
						</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</main>

<!-- needed to use style to give a bit of detailed shadows (tailwind wasn't supporting me on this one :C) -->
<style>
	.trade-heading {
		text-shadow: 0px 5px 10px var(--color-primary);
	}
	.flask {
		box-shadow: 0px 0px 20px 4px var(--color-primary);
	}
</style>
