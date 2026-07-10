<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte"
	import * as Dialog from "$lib/components/ui/dialog"
	import { cn } from "$lib/lib/utils"
	import type { UserCurrency } from "$lib/types"

	let qty = $state(1)
	let grantAmount = $state(0)

	type ShopItem = {
		name: string
		description: string
		price: UserCurrency
		image: string
	}

	let {
		open = $bindable(false),
		allItems = [] as ShopItem[],
		item = {
			name: "",
			description: "",
			price: { redstone: 0, glowstone: 0, aqua_regia: 0, potion_mix: 0 },
			image: "",
		},
		currency,
		onConfirm = (qty: number) => {},
	}: {
		open: boolean
		allItems: ShopItem[]
		item: ShopItem
		currency: UserCurrency
		onConfirm: (qty: number) => void
	} = $props()

	let isGrant = $derived(item.name.toLowerCase().includes("grant"))

	const currencyNames: Record<keyof UserCurrency, string> = {
		redstone: "Redstone",
		glowstone: "Glowstone",
		aqua_regia: "Aqua Regia",
		potion_mix: "Potion Mix",
	}

	const currencyTheme = {
		redstone: {
			border: "border-red-950/40 focus-within:border-red-500",
			text: "text-red-400",
			bg: "bg-red-500/10",
		},
		glowstone: {
			border: "border-yellow-950/40 focus-within:border-yellow-500",
			text: "text-yellow-400",
			bg: "bg-yellow-500/10",
		},
		aqua_regia: {
			border: "border-blue-950/40 focus-within:border-blue-500",
			text: "text-blue-400",
			bg: "bg-blue-500/10",
		},
		potion_mix: {
			border: "border-rose-950/40 focus-within:border-rose-500",
			text: "text-rose-400",
			bg: "bg-rose-500/10",
		},
	}

	const renderCurrency = (
		currency: UserCurrency
	): [string, keyof UserCurrency] => {
		if (currency.redstone > 0)
			return [`${currency.redstone} Redstone`, "redstone"]
		if (currency.glowstone > 0)
			return [`${currency.glowstone} Glowstone`, "glowstone"]
		if (currency.aqua_regia > 0)
			return [`${currency.aqua_regia} Aqua Regia`, "aqua_regia"]
		if (currency.potion_mix > 0)
			return [`${currency.potion_mix} Potion Mix`, "potion_mix"]
		return ["0 Currency", "potion_mix"]
	}

	let currencyToShow = $derived(renderCurrency(item.price))
	let currentCurrencyKey = $derived(currencyToShow[1])
	let activeTheme = $derived(currencyTheme[currentCurrencyKey])

	let basePriceValue = $derived(item.price[currentCurrencyKey] ?? 0)
	let totalCost = $derived(basePriceValue * qty)

	function getEstimatedHours(
		currencyType: keyof UserCurrency,
		amount: number
	): number {
		if (amount <= 0) return 0
		let hours = currencyType === "potion_mix" ? amount / 4.5 : amount
		return Number(hours.toFixed(2))
	}
	let totalEstimatedHours = $derived(
		getEstimatedHours(currentCurrencyKey, totalCost)
	)

	const isDisabled = (
		userHas: UserCurrency,
		itemPrice: UserCurrency,
		currentQty: number
	) => {
		return (
			userHas.redstone < currentQty * itemPrice.redstone ||
			userHas.glowstone < currentQty * itemPrice.glowstone ||
			userHas.aqua_regia < currentQty * itemPrice.aqua_regia ||
			userHas.potion_mix < currentQty * itemPrice.potion_mix ||
			currentQty < 1
		)
	}
	let disabled = $derived(isDisabled(currency, item.price, qty))

	let grantUnitValue = $derived.by(() => {
		if (!item.name) return 0
		const match = item.name.match(/\$(\d+(?:\.\d+)?)/)
		return match ? parseFloat(match[1]) : 0
	})

	let unitValue = $derived(isGrant && grantUnitValue > 0 ? grantUnitValue : 10)

	function handleQtyInput(val: number) {
		qty = Math.max(1, val)
		grantAmount = qty * unitValue
	}

	function handleGrantInput(val: number) {
		grantAmount = Math.max(0, val)
		if (unitValue > 0) {
			qty = Math.max(1, Math.floor(grantAmount / unitValue))
		}
	}

	$effect(() => {
		if (open && item) {
			qty = 1
			grantAmount = unitValue
		}
	})
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="min-w-[80vw] bg-background border border-border rounded-3xl p-8 shadow-2xl transition-all"
	>
		<div class="grid grid-cols-1 md:grid-cols-12 gap-8">
			<div
				class="md:col-span-5 flex flex-col gap-4 border border-zinc-800/60 p-4 rounded-2xl bg-zinc-900/20"
			>
				<div
					class="overflow-hidden rounded-xl bg-zinc-950 aspect-video md:h-48 w-full flex items-center justify-center"
				>
					<img
						src={item.image}
						alt={item.name}
						class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
					/>
				</div>

				<div class="space-y-2">
					<Dialog.Title class="text-2xl font-bold tracking-tight text-zinc-100">
						{item.name}
					</Dialog.Title>
					<div
						class="text-muted-foreground text-sm leading-relaxed max-h-32 overflow-y-auto pr-1 whitespace-pre-wrap"
					>
						{item.description}
					</div>
				</div>
			</div>

			<div class="md:col-span-7 flex flex-col justify-between space-y-6">
				<div class="space-y-4">
					<div
						class="p-4 rounded-xl space-y-2.5 border transition-colors {activeTheme.border} {activeTheme.bg}"
					>
						<div class="flex justify-between items-center text-sm font-medium">
							<span class="text-muted-foreground">Unit Price:</span>
							<span class={activeTheme.text}>{currencyToShow[0]}</span>
						</div>
						<div class="flex justify-between items-center text-sm font-medium">
							<span class="text-muted-foreground">Your Balance:</span>
							<span class="text-zinc-300"
								>{currency[currentCurrencyKey]}
								{currencyNames[currentCurrencyKey]}</span
							>
						</div>

						{#if totalEstimatedHours > 0}
							<div
								class="pt-2 mt-2 border-t border-zinc-800/40 flex justify-between items-center text-xs text-muted-foreground"
							>
								<span>Est. Time:</span>
								<span class="font-mono text-zinc-400"
									>{totalEstimatedHours} hrs</span
								>
							</div>
						{/if}
					</div>
					<div
						class={cn(
							"w-full grid",
							isGrant ? "grid-cols-2 gap-x-4" : "grid-cols-1"
						)}
					>
						<div
							class="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-950/40 px-4"
						>
							<span class="text-sm font-medium text-zinc-400">Quantity</span>
							<div class="flex items-center gap-2">
								<input
									type="number"
									min="1"
									value={qty}
									class="w-20 bg-zinc-900/60 text-zinc-100 font-mono text-right p-1.5 px-3 border border-zinc-800 rounded-lg outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm"
									oninput={e =>
										handleQtyInput(
											parseInt((e.target as HTMLInputElement).value) || 1
										)}
								/>
							</div>
						</div>

						{#if isGrant}
							<div
								class="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-950/40 px-4"
							>
								<span class="text-sm font-medium text-zinc-400">Amount</span>
								<div class="flex items-center gap-1">
									<Button
										variant="outline"
										onclick={() => handleGrantInput(grantAmount - unitValue)}
										disabled={grantAmount <= unitValue}
										class="h-8 w-8 p-0"
									>
										-
									</Button>

									<input
										type="number"
										readonly
										min={unitValue}
										step={unitValue}
										value={grantAmount}
										class="max-w-20 bg-zinc-900/60 text-zinc-100 font-mono text-center py-1.5 border border-zinc-800 rounded-lg outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
										onblur={e =>
											handleGrantInput(
												parseInt((e.target as HTMLInputElement).value) || 0
											)}
									/>

									<Button
										variant="outline"
										onclick={() => handleGrantInput(grantAmount + unitValue)}
										class="h-8 w-8 p-0"
									>
										+
									</Button>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<div class="space-y-4 pt-4 border-t border-zinc-900">
					<div class="flex justify-between items-baseline px-1">
						<span class="text-sm font-medium text-zinc-400">Total Expense:</span
						>
						<span
							class="text-2xl font-bold tracking-tight {disabled
								? 'text-zinc-500'
								: activeTheme.text}"
						>
							{totalCost}
							{currencyNames[currentCurrencyKey]}
						</span>
					</div>

					<div class="flex gap-3 justify-end w-full">
						<Button
							variant="outline"
							onclick={() => (open = false)}
							class="py-5 px-6 rounded-xl hover:bg-zinc-900 transition-colors"
						>
							Cancel
						</Button>

						<Button
							onclick={() => {
								onConfirm(qty)
								open = false
							}}
							{disabled}
							class="py-5 px-8 rounded-xl font-medium tracking-wide shadow-lg transition-all hover:bg-primary/70"
						>
							Confirm Order
						</Button>
					</div>
				</div>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
