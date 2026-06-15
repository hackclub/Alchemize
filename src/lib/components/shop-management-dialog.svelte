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
	import { toast } from "svelte-sonner"
	import { Trash } from "lucide-svelte"
	interface Item {
		itemID: string
		name: string
		description: string
		price: {
			redstone: number
			glowstone: number
			aqua_regia: number
			potion_mix: number
		}
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
	const onDelete = async () => {}
	let currency = $state(() => {
		if (shopItem) {
			if (shopItem?.price.redstone > 0) {
				return "redstone"
			} else if (shopItem?.price.glowstone > 0) {
				return "glowstone"
			} else if (shopItem?.price.aqua_regia > 0) {
				return "aqua_regia"
			} else if (shopItem?.price.potion_mix > 0) {
				return "potion_mix"
			} else {
				return "redstone"
			}
		} else {
			return "potion_mix"
		}
	})
	let currencyVal = $state(shopItem?.price[currency()] ?? 0)

	let currencyChose = $state(currency())
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
		currencyVal = shopItem?.price[currency()] ?? 0
		currencyChose = currency()
	})
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="min-w-[65vw]  h-[90vh] max-h-[90vh] overflow-hidden flex flex-col border border-admin-primary/70 bg-zinc-950 text-zinc-50 p-0 gap-0 shadow-2xl"
	>
		<Dialog.Header class="p-0 shrink-0 border-b border-admin-primary/70">
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
							class="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500 mb-1"
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
							class="bg-zinc-900/50 border-admin-primary/70 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-blue-500 focus-visible:border-transparent"
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
							class="h-36 bg-zinc-900/50 border-admin-primary/70 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-blue-500 focus-visible:border-transparent resize-none leading-relaxed"
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
									class="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer border-admin-primary/70 hover:border-zinc-700 transition"
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
									class="h-4 w-4 rounded border-admin-primary/70 text-red-500 focus:ring-red-500 focus:ring-offset-2"
									bind:checked={useCdnLink}
								/> Add Link Instead
							</div>
						{/if}

						<Input
							disabled={!useCdnLink}
							name="cdnImage"
							type="url"
							class="bg-zinc-900/50 border-admin-primary/70 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-red-500 focus-visible:border-transparent resize-none leading-relaxed"
							placeholder="Enter the cdn link for the image."
							bind:value={cdnLink}
						/>
					</div>

					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<Label
								for="currency"
								class="text-xs font-semibold uppercase tracking-wider text-zinc-400"
								>Price</Label
							>
						</div>
						<div class="flex items-center gap-2">
							<Input
								id="currency"
								name="itemPrice"
								type="number"
								required
								placeholder="Enter the currency value."
								class=" bg-zinc-900/50 border-admin-primary/70 text-zinc-100 placeholder:text-zinc-600  focus-visible:border-transparent resize-none leading-relaxed"
								bind:value={currencyVal}
							/>
							<select
								bind:value={currencyChose}
								name="currencyType"
								class="flex h-8 w-full rounded-md border border-admin-primary/70 bg-zinc-950 px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-zinc-100"
							>
								<option value="redstone" selected={currency() === "redstone"}
									>Redstone</option
								>
								<option value="glowstone" selected={currency() === "glowstone"}>
									Glowstone</option
								>
								<option
									value="aqua_regia"
									selected={currency() === "aqua_regia"}>Aqua Regia</option
								>
								<option
									value="potion_mix"
									selected={currency() === "potion_mix"}>Potion Mix</option
								>
							</select>
						</div>
					</div>

					<div
						class="flex items-center justify-between gap-3 pt-4 border-t border-zinc-900"
					>
						<div>
							{#if mode === "update"}
								<Button
									type="button"
									variant="destructive"
									class="text-xs font-semibold uppercase tracking-wider h-10"
									onclick={onDelete}
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
									class="bg-admin-primary hover:bg-admin-primary/80 text-admin-text text-xs font-bold uppercase tracking-wider px-6 h-10 shadow-lg shadow-red-950/20"
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
