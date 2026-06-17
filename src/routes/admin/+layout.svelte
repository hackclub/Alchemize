<script lang="ts">
	import { page } from "$app/state"
	import { onMount } from "svelte"
	import Adminnav from "$lib/components/adminnav.svelte"
	import AdminThemeEditor from "$lib/components/AdminThemeEditor.svelte"
	import { loaderStore } from "$lib/stores/adminLoader"
	import { navigating } from "$app/stores"
	import * as Dialog from "$lib/components/ui/dialog/index.js"
	import { Button } from "$lib/components/ui/button/index.js"
	import { Palette } from "lucide-svelte"

	let { children } = $props()
	const excludedRoutes = ["/admin", "/admin/login", "/admin/error"]
	const colorRoutes = "/admin/review2/"
	let adminPrimary = $state("#6875f6")
	let adminHover = $state("#7a8aff")
	let adminText = $state("#dce6f2")
	let adminBg = $state("#172554")
	let admin2Bg = $state("#0C4A6E")
	if (page.url.pathname.includes(colorRoutes)) {
		adminBg = "#171714"
		admin2Bg = "#030303"
	}
	let triggerEl: HTMLButtonElement | null = $state(null)
	let buttonX = $state(20)
	let buttonY = $state(20)
	let isDragging = false
	let hasDragged = false
	let dragOffsetX = 0
	let dragOffsetY = 0

	function captureElement(node: HTMLButtonElement) {
		triggerEl = node
	}

	onMount(() => {
		buttonX = window.innerWidth - 80
		buttonY = window.innerHeight - 80
	})

	const onPointerDown = (event: PointerEvent) => {
		if (!triggerEl) return
		isDragging = true
		hasDragged = false
		dragOffsetX = event.clientX - buttonX
		dragOffsetY = event.clientY - buttonY
		triggerEl.setPointerCapture(event.pointerId)
	}

	const onPointerMove = (event: PointerEvent) => {
		if (!isDragging) return
		if (
			Math.abs(event.clientX - buttonX - dragOffsetX) > 2 ||
			Math.abs(event.clientY - buttonY - dragOffsetY) > 2
		) {
			hasDragged = true
		}
		buttonX = Math.max(
			10,
			Math.min(window.innerWidth - 70, event.clientX - dragOffsetX)
		)
		buttonY = Math.max(
			10,
			Math.min(window.innerHeight - 70, event.clientY - dragOffsetY)
		)
	}

	const onPointerUp = (event: PointerEvent) => {
		if (!isDragging) return
		isDragging = false
		triggerEl?.releasePointerCapture(event.pointerId)
	}

	const handleTriggerClick = (event: MouseEvent) => {
		if (hasDragged) {
			event.preventDefault()
			event.stopPropagation()
		}
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
{#if $navigating || $loaderStore}
	<div
		class="fixed inset-0 bg-black/70 flex items-center justify-center z-80 backdrop-blur-none"
	>
		<div class="flex flex-col items-center gap-4">
			<div
				class="w-12 h-12 border-4 border-gray-600 border-t-admin-primary rounded-full animate-spin"
			></div>
			<p class="text-white text-lg">Loading...</p>
		</div>
	</div>
{/if}
{#if !excludedRoutes.includes(page.url.pathname)}
	<Dialog.Root>
		<div
			class="fixed z-50 touch-none select-none"
			style="left: {buttonX}px; top: {buttonY}px;"
		>
			<Dialog.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						bind:ref={triggerEl}
						onpointerdown={onPointerDown}
						onclickcapture={handleTriggerClick}
						class="h-12 w-12 rounded-full shadow-2xl cursor-move bg-admin-primary text-primary-foreground hover:bg-admin-primary/90"
						aria-label="Open Theme Editor"
					>
						<Palette class="h-5 w-5" />
					</Button>
				{/snippet}
			</Dialog.Trigger>
		</div>

		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>Theme Settings</Dialog.Title>
				<Dialog.Description>
					Tired of reviewing all day? Phew! Change the colors of the dashboard
					to your liking!
				</Dialog.Description>
			</Dialog.Header>

			<div class="py-4">
				<AdminThemeEditor
					bind:adminPrimary
					bind:adminHover
					bind:adminText
					bind:adminBg
					bind:admin2Bg
				/>
			</div>
		</Dialog.Content>
	</Dialog.Root>
{/if}

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
