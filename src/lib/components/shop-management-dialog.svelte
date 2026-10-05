<script lang="ts">
	import { enhance } from "$app/forms"
	import * as Dialog from "$lib/components/ui/dialog"
	import { Input } from "$lib/components/ui/input"
	import { Textarea } from "$lib/components/ui/textarea"
	import { Checkbox } from "$lib/components/ui/checkbox"
	import { Label } from "$lib/components/ui/label"
	import { Button } from "$lib/components/ui/button"
	import type { AirtableProject } from "$lib/types"
	import { countCharacters } from "$lib/utils"
	import { CURRENCY_NAME, hundredthsToUnits } from "$lib/currency"
	import { toast } from "svelte-sonner"
	import { Trash } from "lucide-svelte"
	interface Item {
		itemID: string
		name: string
		description: string
		priceHundredths: number
		image: string
	}
	let {
		mode,
		shopItem,
		open = $bindable(false),
		invalidater,
	}: {
		mode: "create" | "update"
		shopItem: Item | null
		open: boolean
		invalidater?: () => void
	} = $props()

	let showRotator = $state(false)
	let showSecondRotator = $state(false)
	let name = $state(shopItem?.name ?? "")
	let description = $state(shopItem?.description ?? "")
	let files: any = $state()
	let fileinputPreview: any = $state("")
	let hasFile = $derived(files && files.length > 0)
	let allFieldsFilled = $derived(name && description)
	let cdnLink = $state(shopItem?.image ?? "")
	let useCdnLink = $state(shopItem?.image ? true : false)
	let priceUnits = $state<number | undefined>(
		shopItem ? hundredthsToUnits(shopItem.priceHundredths) : undefined
	)
	$effect(() => {
		if (files && files.length > 0) {
			const file = files[0]
			const objectUrl = URL.createObjectURL(file)
			console.log("File input Link created dynamically:", objectUrl)
			fileinputPreview = objectUrl

			// Cleanup: revoke the URL when files change or component destroys
			return () => {
				URL.revokeObjectURL(objectUrl)
			}
		} else {
			fileinputPreview = ""
		}
	})
	$effect(() => {
		name = shopItem?.name ?? ""
		description = shopItem?.description ?? ""
		cdnLink = shopItem?.image ?? ""
		useCdnLink = !!shopItem?.image
		priceUnits = shopItem ? hundredthsToUnits(shopItem.priceHundredths) : undefined
	})
	const onDelete = async () => {
		invalidater?.()
		open = false
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="min-w-[65vw]  h-[90vh] max-h-[90vh] overflow-hidden flex flex-col border border-primary/70 bg-zinc-950 text-zinc-50 p-0 gap-0 shadow-2xl"
	>
		<Dialog.Header class="p-0 shrink-0 border-b border-primary/70">
			<div
				class="relative overflow-hidden bg-gradient-to-r from-red-950/20 via-zinc-900/40 to-zinc-950 p-6"
			>
				{#if mode === "update" && shopItem?.image}
					<img
						src={shopItem.image}
						alt=""
						class="absolute inset-0 h-full w-full object-cover opacity-10 pointer-events-none filter blur-sm"
					/>
				{/if}

				<div
					class="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4"
				>
					<div>
						<p
							class="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500 mb-1"
						>
							Alchemize Shop
						</p>
						<h1
							class="text-2xl sm:text-3xl font-black tracking-tight text-zinc-100"
						>
							{mode === "create"
								? "Create New Shop Item"
								: shopItem?.name || "Untitled Item"}
						</h1>
					</div>
				</div>
			</div>
		</Dialog.Header>

		<div class="flex-1 overflow-y-auto p-6 bg-zinc-950">
			<div class="max-w-3xl mx-auto w-full">
				<form
					enctype="multipart/form-data"
					method="POST"
					action="?/upsert"
					class="space-y-6 order-1 lg:order-2"
					use:enhance={() => {
						showSecondRotator = true
						return async ({ result }) => {
							showSecondRotator = false
							if (result.type === "success") {
								toast.success(
									mode === "create"
										? "Shop item created successfully!"
										: "Shop item updated successfully!"
								)
							} else {
								toast.error("An error occurred. Please try again.")
								console.error("Form submission error:", result)
							}
							await invalidater?.()
						}
					}}
				>
					{#if mode === "update"}
						<input type="hidden" name="itemID" value={shopItem?.itemID} />
					{/if}

					<div class="space-y-2">
						<Label
							for="name"
							class="text-xs font-semibold uppercase tracking-wider text-zinc-400"
							>Item Name</Label
						>
						<Input
							id="name"
							name="name"
							required
							placeholder="Give your masterpiece a name"
							bind:value={name}
							class="bg-zinc-900/50 border-primary/70 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-blue-500 focus-visible:border-transparent"
						/>
					</div>

					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<Label
								for="description"
								class="text-xs font-semibold uppercase tracking-wider text-zinc-400"
								>Item Description</Label
							>
						</div>
						<Textarea
							id="description"
							name="description"
							required
							placeholder="Describe what you are building. Markdown is fully supported."
							class="h-36 bg-zinc-900/50 border-primary/70 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-blue-500 focus-visible:border-transparent resize-none leading-relaxed"
							bind:value={description}
						/>
					</div>

					<div class="space-y-2">
						<Label
							for="screenshot"
							class="text-xs font-semibold uppercase tracking-wider text-zinc-400"
							>Image</Label
						>
						{#if mode === "create"}
							<div
								class="flex items-center justify-center w-full {useCdnLink
									? 'bg-neutral-900'
									: 'bg-transparent'}"
							>
								<label
									for="screenshot"
									class="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer border-primary/70 hover:border-zinc-700 transition"
									style={fileinputPreview
										? `background-image: url('${fileinputPreview}'); background-size: contain; background-position: center; filter: backdrop-blur(2px);`
										: "background-color: transparent;"}
								>
									<div
										class="flex flex-col items-center justify-center pt-3 pb-3"
									>
										<p class="text-xs text-zinc-400 font-medium">
											{hasFile
												? "Screenshot ready to upload"
												: "Click to upload a screenshot"}
										</p>
										<p class="text-[10px] text-zinc-600 mt-1">
											PNG, JPG, GIF up to 5MB
										</p>
									</div>
									<input
										id="screenshot"
										name="img"
										type="file"
										accept="image/*"
										required
										class="hidden"
										bind:files
										disabled={useCdnLink}
									/>
								</label>
							</div>
							<div class="flex gap-3 text-xs mt-2 text-neutral-400">
								<Checkbox
									id="cdnLink"
									name="cdnLink"
									class="h-4 w-4 rounded border-primary/70 text-red-500 focus:ring-red-500 focus:ring-offset-2"
									bind:checked={useCdnLink}
								/> Add Link Instead
							</div>
						{/if}

						<Input
							disabled={!useCdnLink}
							name="cdnImage"
							type="url"
							class="bg-zinc-900/50 border-primary/70 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-red-500 focus-visible:border-transparent resize-none leading-relaxed"
							placeholder="Enter the cdn link for the image."
							bind:value={cdnLink}
						/>
					</div>

					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<Label
								for="price"
								class="text-xs font-semibold uppercase tracking-wider text-zinc-400"
								>Price ({CURRENCY_NAME})</Label
							>
						</div>
						<div class="flex items-center gap-2">
							<Input
								id="price"
								name="itemPrice"
								type="number"
								step="0.01"
								min="0.01"
								required
								placeholder="Enter the price in {CURRENCY_NAME}, e.g. 66.4"
								class=" bg-zinc-900/50 border-primary/70 text-zinc-100 placeholder:text-zinc-600  focus-visible:border-transparent resize-none leading-relaxed"
								bind:value={priceUnits}
							/>
							<span class="text-sm text-zinc-400 whitespace-nowrap"
								>{CURRENCY_NAME}</span
							>
						</div>
					</div>

					<div
						class="flex items-center justify-between gap-3 pt-4 border-t border-zinc-900"
					>
						<div>
							{#if mode === "update"}
								<Button
									type="submit"
									variant="destructive"
									class="text-xs font-semibold uppercase tracking-wider h-10"
									onclick={onDelete}
									formaction="?/delete"
									disabled={showRotator || showSecondRotator}
								>
									<Trash /> Delete Item
								</Button>
							{/if}
						</div>
						<div>
							<Button
								type="button"
								variant="outline"
								class="text-xs h-10 font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-200"
								onclick={() => (open = false)}
							>
								Cancel
							</Button>
							<Dialog.Close>
								<Button
									type="submit"
									class="bg-primary hover:bg-primary/80 text-primary text-xs font-bold uppercase tracking-wider px-6 h-10 shadow-lg shadow-red-950/20"
									onclick={() => {
										//Check for all the fields
										if (!name || !description || files?.length === 0) {
											toast.error("Please fill in all required fields.")
											return
										}
									}}
								>
									{#if showSecondRotator}
										<div
											class="w-3.5 h-3.5 border-2 border-zinc-400 border-t-white rounded-full animate-spin mr-2"
										></div>
									{/if}
									{mode === "create" ? "Add Item" : "Update Item"}
								</Button>
							</Dialog.Close>
						</div>
					</div>
				</form>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #27272a;
		border-radius: 2px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: #3f3f46;
	}
</style>
