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
		item = {
			name: "",
			description: "",
			priceHundredths: 0,
			image: "",
		},
		balanceHundredths,
		onConfirm = () => {},
	}: {
		open: boolean
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
	let totalEstimatedHours = $derived(totalCost > 0 ? Math.ceil(hundredthsToUnits(totalCost)) : 0)

	let disabled = $derived((balanceHundredths ?? 0) < (item.priceHundredths ?? 0) * qty || qty < 1)

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
		class="min-w-[80vw] rounded rounded-tl-3xl rounded-br-3xl border bg-secondary/80 p-8 shadow-2xl backdrop-blur-2xl transition-all [&>button]:hidden">
		<div class="grid grid-cols-1 gap-8 md:grid-cols-12">
			<div class="flex flex-col gap-4 rounded-2xl border bg-secondary/20 md:col-span-5">
				<div
					class="flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-secondary md:h-48">
					<img src={item.image} alt={item.name} class="h-full w-full object-cover" />
				</div>

				<div class="space-y-2 p-2">
					<Dialog.Title class="text-2xl font-bold tracking-tight text-secondary-foreground">
						{item.name}
					</Dialog.Title>
					<div class="max-h-32 overflow-y-auto pr-1 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
						{item.description}
					</div>
				</div>
			</div>

			<div class="flex flex-col justify-between space-y-6 md:col-span-7">
				<div class="space-y-4">
					<div class="space-y-2.5 rounded-xl border p-4 transition-colors {activeTheme.border} {activeTheme.bg}">
						<div class="flex items-center justify-between text-sm font-medium">
							<span class="text-muted-foreground">Unit Price:</span>
							<span class={activeTheme.text}>{formatAqua(item.priceHundredths)}</span>
						</div>
						<div class="flex items-center justify-between text-sm font-medium">
							<span class="text-muted-foreground">Your Balance:</span>
							<span class="">{formatAqua(balanceHundredths)}</span>
						</div>

						{#if totalEstimatedHours > 0}
							<div
								class="mt-2 flex items-center justify-between border-t border-zinc-800/40 pt-2 text-xs text-muted-foreground">
								<span>Est. Time:</span>
								<span class="font-mono text-zinc-400">{totalEstimatedHours} hrs</span>
							</div>
						{/if}
					</div>
					<div class={cn("grid w-full", isGrant ? "grid-cols-2 gap-x-4" : "grid-cols-1")}>
						<div class="flex items-center justify-between rounded-xl border bg-secondary/40 p-3 px-4">
							<span class="text-sm font-medium text-secondary-foreground">Quantity</span>
							<div class="flex items-center gap-2">
								<input
									type="number"
									min="1"
									value={qty}
									class="w-20 rounded-lg border bg-input p-1.5 px-3 text-right text-sm transition-all outline-none focus:border-primary focus:ring-1 focus:ring-primary"
									oninput={e => handleQtyInput(parseInt((e.target as HTMLInputElement).value) || 1)} />
							</div>
						</div>

						{#if isGrant}
							<div class="flex items-center justify-between rounded-xl border bg-secondary/40 p-3 px-4">
								<span class="text-sm font-medium text-secondary-foreground">Amount</span>
								<div class="flex items-center gap-1">
									<Button
										variant="outline"
										onclick={() => handleGrantInput(grantAmount - unitValue)}
										disabled={grantAmount <= unitValue}
										class="h-8 w-8 p-0">
										-
									</Button>

									<input
										type="number"
										readonly
										min={unitValue}
										step={unitValue}
										value={grantAmount}
										class="max-w-20 [appearance:textfield] rounded-lg border bg-input py-1.5 text-center text-sm transition-all outline-none focus:border-primary focus:ring-1 focus:ring-primary [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
										onblur={e => handleGrantInput(parseInt((e.target as HTMLInputElement).value) || 0)} />

									<Button
										variant="outline"
										onclick={() => handleGrantInput(grantAmount + unitValue)}
										class="h-8 w-8 p-0">
										+
									</Button>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<div class="space-y-4 border-t pt-4">
					<div class="flex items-baseline justify-between px-1">
						<span class="text-sm font-medium">Total Expense:</span>
						<span class="text-2xl font-bold tracking-tight {disabled ? 'text-muted-foreground' : activeTheme.text}">
							{formatAqua(totalCost)}
						</span>
					</div>

					<div class="flex w-full justify-end gap-3">
						<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>

						<Button
							onclick={() => {
								onConfirm(qty)
								open = false
							}}
							{disabled}
							variant="primary">
							Confirm Order
						</Button>
					</div>
				</div>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
