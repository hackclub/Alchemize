<script lang="ts">
	let {
		adminPrimary = $bindable(),
		adminHover = $bindable(),
		adminText = $bindable(),
		adminBg = $bindable(),
		admin2Bg = $bindable(),
	} = $props()
</script>

<div class="grid gap-4">
	<div class="grid grid-cols-3 items-center gap-4">
		<label for="adminPrimary" class="text-sm leading-none font-medium"> Admin Primary </label>
		<input
			type="color"
			id="adminPrimary"
			bind:value={adminPrimary}
			class="col-span-2 h-8 w-full cursor-pointer rounded-md border border-input bg-background" />
	</div>
	<div class="grid grid-cols-3 items-center gap-4">
		<label for="adminHover" class="text-sm leading-none font-medium">Admin Hover</label>
		<input
			type="color"
			id="adminHover"
			bind:value={adminHover}
			class="col-span-2 h-8 w-full cursor-pointer rounded-md border border-input bg-background" />
	</div>
	<div class="grid grid-cols-3 items-center gap-4">
		<label for="adminText" class="text-sm leading-none font-medium">Admin Text</label>
		<input
			type="color"
			id="adminText"
			bind:value={adminText}
			class="col-span-2 h-8 w-full cursor-pointer rounded-md border border-input bg-background" />
	</div>
	<div class="grid grid-cols-3 items-center gap-4">
		<label for="adminBg" class="text-sm leading-none font-medium">Admin Bg</label>
		<input
			type="color"
			id="adminBg"
			bind:value={adminBg}
			class="col-span-2 h-8 w-full cursor-pointer rounded-md border border-input bg-background" />
	</div>
	<div class="grid grid-cols-3 items-center gap-4">
		<label for="admin2Bg" class="text-sm leading-none font-medium">Admin Bg 2</label>
		<input
			type="color"
			id="admin2Bg"
			bind:value={admin2Bg}
			class="col-span-2 h-8 w-full cursor-pointer rounded-md border border-input bg-background" />
	</div>
</div>
