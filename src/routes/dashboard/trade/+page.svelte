<script>
	import Input from "$lib/components/ui/input/input.svelte"
</script>

<main class="w-full h-screen bg-gradbg">
	<div class="fixed inset-0 bg-black/60 z-10"></div>
	<div class="relative z-50 flex justify-around w-full h-full">
		<div class="flex flex-col h-full justify-around">
			<div class="flex flex-col items-center gap-y-3">
				<img
					src="/alch-redstone.png"
					alt="Redstone"
					class="pointer-events-none h-30 w-auto"
				/>
				<Input type="number" />
			</div>
			<div class="flex flex-col items-center gap-y-3">
				<img
					src="/alch-glowstone.png"
					alt="Glowstone"
					class="pointer-events-none h-30 w-auto"
				/>
				<Input type="number" />
			</div>
			<div class="flex flex-col items-center gap-y-3">
				<img
					src="/alch-aquaregia.png"
					alt="Aqua Regia"
					class="pointer-events-none h-30 w-auto"
				/>
				<Input type="number" />
			</div>
		</div>
		<div class=" flex flex-col h-full justify-around">
			<div class=" flex flex-col items-center gap-y-3">
				<img
					src="/Alchemize.png"
					alt="Potion Mix"
					class=" pointer-events-none h-40 w-auto"
				/>
				<!-- the input is disabled cuz its read only ofc -->
				<Input type="number" disabled />
			</div>
		</div>
	</div>
</main>
<div class="flex w-full h-screen justify-center items-center absolute">
	<div class="w-1/3 flex flex-col justify-around h-full pl-5">
		<div class="w-1/2 border-t border-gray-500 border-dashed"></div>
		<div class="w-full border-t border-gray-500 border-dashed"></div>
		<div class="w-1/2 border-t border-gray-500 border-dashed"></div>
	</div>
	<div
		class=" flex flex-col justify-around h-2/3 absolute border-r border-gray-500 border-dashed ml-5"
	></div>
</div>
