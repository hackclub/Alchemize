<script lang="ts">
	import { page } from "$app/state"
	import { onMount } from "svelte"
	import Adminnav from "$lib/components/adminnav.svelte"

	let { children } = $props()
	const excludedRoutes = ["/admin", "/admin/login"]
	let adminPrimary = $state("#6875f6")
	let adminHover = $state("#7a8aff")
	let adminText = $state("#dce6f2")
	let adminBg = $state("#172554")
	let admin2Bg = $state("#0C4A6E")

	let themeEditorEl: HTMLDivElement | null = $state(null)
	let editorX = $state(12)
	let editorY = $state(12)
	let isDragging = false
	let dragOffsetX = 0
	let dragOffsetY = 0
	onMount(() => {
		editorX = window.innerWidth - 200
		editorY = window.innerHeight - 200
	})
	const onPointerDown = (event: PointerEvent) => {
		if (!themeEditorEl) return
		isDragging = true
		dragOffsetX = event.clientX - editorX
		dragOffsetY = event.clientY - editorY
		themeEditorEl.setPointerCapture(event.pointerId)
	}

	const onPointerMove = (event: PointerEvent) => {
		if (!isDragging) return
		editorX = Math.max(0, event.clientX - dragOffsetX)
		editorY = Math.max(0, event.clientY - dragOffsetY)
	}

	const onPointerUp = (event: PointerEvent) => {
		if (!isDragging) return
		isDragging = false
		themeEditorEl?.releasePointerCapture(event.pointerId)
	}

	onMount(() => {
		window.addEventListener("pointermove", onPointerMove)
		window.addEventListener("pointerup", onPointerUp)
		return () => {
			window.removeEventListener("pointermove", onPointerMove)
			window.removeEventListener("pointerup", onPointerUp)
		}
	})
</script>

<div
	class="style"
	style="--admin-primary: {adminPrimary}; --admin-hover: {adminHover}; --admin-text: {adminText}; --admin-bg: {adminBg}; --admin2-bg: {admin2Bg}"
>
	<div class="bg-admin fixed w-screen h-screen -z-10">
		<div class="fixed inset-0 bg-black/60 -z-20"></div>
		<div class="bg fixed w-screen h-screen -z-10"></div>
	</div>
	{@render children()}
</div>
{#if !excludedRoutes.includes(page.url.pathname)}
	<Adminnav />
{/if}
<div
	bind:this={themeEditorEl}
	class="themeEditor absolute h-50 w-60 pt-3 pl-3 bg-[#000000b0] z-50 flex flex-col rounded-2xl"
	style="left: {editorX}px; top: {editorY}px;"
>
	<span
		class="text-white text-sm cursor-move select-none"
		ARIA-label="Drag to move"
		on:pointerdown={onPointerDown}>Edit the Themes</span
	>
	<div class="flex text-xs items-center gap-3">
		<label for="theme-select" class="w-24">Admin Primary</label>
		<input
			type="color"
			name="themeColor"
			id="themeColor"
			bind:value={adminPrimary}
		/>
	</div>
	<div class="flex text-xs items-center gap-3">
		<label for="theme-select" class="w-24">Admin Hover</label>
		<input
			type="color"
			name="themeColor"
			id="themeColor"
			bind:value={adminHover}
		/>
	</div>
	<div class="flex text-xs items-center gap-3">
		<label for="theme-select" class="w-24">Admin Text</label>
		<input
			type="color"
			name="themeColor"
			id="themeColor"
			bind:value={adminText}
		/>
	</div>
	<div class="flex text-xs items-center gap-3">
		<label for="theme-select" class="w-24">Admin Bg</label>
		<input
			type="color"
			name="themeColor"
			id="themeColor"
			bind:value={adminBg}
		/>
	</div>
	<div class="flex text-xs items-center gap-3">
		<label for="theme-select" class="w-24">Admin Bg 2</label>
		<input
			type="color"
			name="themeColor"
			id="themeColor"
			bind:value={admin2Bg}
		/>
	</div>
</div>

<style>
	.bg {
		background-image: linear-gradient(#ffffff13 1px, #0000 0),
			linear-gradient(90deg, #ffffff13 1px, #0000 0);
		background-size: 40px 40px;
	}
	.bg-admin {
		background-image: linear-gradient(
			to bottom right,
			var(--color-neutral-900),
			var(--admin-bg),
			var(--admin2-bg)
		);
	}
</style>
