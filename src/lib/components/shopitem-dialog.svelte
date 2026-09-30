<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte"
	import * as Dialog from "$lib/components/ui/dialog"
	import { cn } from "$lib/lib/utils"
	import { formatAqua, hundredthsToUnits } from "$lib/currency"

	let qty = $state(1)
	let grantAmount = $state(0)

	type ShopItem = {
		name: string
		description: string
		priceHundredths: number
		image: string
	}

	let {
		open = $bindable(false),
		allItems = [] as ShopItem[],
		item = {
			name: "",
			description: "",
			priceHundredths: 0,
			image: "",
		},
		balanceHundredths,
		onConfirm = (qty: number) => {},
	}: {
		open: boolean
		allItems: ShopItem[]
		item: ShopItem
		balanceHundredths: number
		onConfirm: (qty: number) => void
	} = $props()

	let isGrant = $derived(
		item.name.toLowerCase().includes("grant") ||
			item.name.toLowerCase().includes("credits") ||
			item.description.toLowerCase().includes("grant") ||
			item.description.toLowerCase().includes("credits")
	)

	const activeTheme = {
		border: "border-blue-950/40 focus-within:border-blue-500",
		text: "text-blue-400",
		bg: "bg-blue-500/10",
	}

	let totalCost = $derived((item.priceHundredths ?? 0) * qty)

	// 1 Aqua Regia = 1 hour of work
	let totalEstimatedHours = $derived(
		totalCost > 0 ? Math.ceil(hundredthsToUnits(totalCost)) : 0
	)

	let disabled = $derived(
		(balanceHundredths ?? 0) < (item.priceHundredths ?? 0) * qty || qty < 1
	)

	let grantUnitValue = $derived.by(() => {
		const grantText = `${item.name} ${item.description}`
		const match = grantText.match(/\$(\d+(?:\.\d+)?)/)
		return match ? parseFloat(match[1]) : 0
	})

	let unitValue = $derived(isGrant && grantUnitValue > 0 ? grantUnitValue : 10)

	function handleQtyInput(val: number) {
		qty = Math.max(1, val)
		grantAmount = qty * unitValue
	}

	function handleGrantInput(val: number) {
		grantAmount = Math.max(unitValue, val)
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
		class="min-w-[80vw] bg-secondary/80 backdrop-blur-2xl border rounded rounded-tl-3xl rounded-br-3xl p-8 shadow-2xl transition-all [&>button]:hidden"
	>
		<div class="grid grid-cols-1 md:grid-cols-12 gap-8">
			<div
				class="md:col-span-5 flex flex-col gap-4 border rounded-2xl bg-secondary/20"
			>
				<div
					class="overflow-hidden rounded-xl bg-secondary aspect-video md:h-48 w-full flex items-center justify-center"
				>
					<img
						src={item.image}
						alt={item.name}
						class="w-full h-full object-cover"
					/>
				</div>

				<div class="space-y-2 p-2">
					<Dialog.Title
						class="text-2xl font-bold tracking-tight text-secondary-foreground"
					>
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
							<span class={activeTheme.text}>{formatAqua(item.priceHundredths)}</span>
						</div>
						<div class="flex justify-between items-center text-sm font-medium">
							<span class="text-muted-foreground">Your Balance:</span>
							<span class="">{formatAqua(balanceHundredths)}</span>
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
							class="flex items-center justify-between p-3 rounded-xl border bg-secondary/40 px-4"
						>
							<span class="text-sm font-medium text-secondary-foreground"
								>Quantity</span
							>
							<div class="flex items-center gap-2">
								<input
									type="number"
									min="1"
									value={qty}
									class="w-20 bg-input text-right p-1.5 px-3 border rounded-lg outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm"
									oninput={e =>
										handleQtyInput(
											parseInt((e.target as HTMLInputElement).value) || 1
										)}
								/>
							</div>
						</div>

						{#if isGrant}
							<div
								class="flex items-center justify-between p-3 rounded-xl border bg-secondary/40 px-4"
							>
								<span class="text-sm font-medium text-secondary-foreground"
									>Amount</span
								>
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
										class="max-w-20 bg-input text-center py-1.5 border rounded-lg outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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

				<div class="space-y-4 pt-4 border-t">
					<div class="flex justify-between items-baseline px-1">
						<span class="text-sm font-medium">Total Expense:</span>
						<span
							class="text-2xl font-bold tracking-tight {disabled
								? 'text-muted-foreground'
								: activeTheme.text}"
						>
							{formatAqua(totalCost)}
						</span>
					</div>

					<div class="flex gap-3 justify-end w-full">
						<Button variant="outline" onclick={() => (open = false)}>
							Cancel
						</Button>

						<Button
							onclick={() => {
								onConfirm(qty)
								open = false
							}}
							{disabled}
							variant="primary"
						>
							Confirm Order
						</Button>
					</div>
				</div>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
