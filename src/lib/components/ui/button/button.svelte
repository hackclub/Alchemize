<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/lib/utils.js"
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements"
	import { type VariantProps, tv } from "tailwind-variants"

	export const buttonVariants = tv({
		base: "inline-flex min-w-0 items-center justify-center gap-2 font-sans text-sm font-semibold leading-none whitespace-nowrap cursor-pointer select-none border-2 border-border rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-px hover:shadow-neo active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
		variants: {
			variant: {
				primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
				secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
				outline: "bg-card text-card-foreground hover:bg-secondary",
				ghost: "border-transparent shadow-none bg-transparent text-foreground hover:bg-secondary",
				destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
			},
			size: {
				xs: "h-9 px-3 text-xs",
				sm: "h-10 px-4",
				default: "h-11 px-5",
				lg: "h-12 px-6 text-base",
				xl: "h-14 px-8 text-lg",
				icon: "size-11 p-0",
				"icon-sm": "size-10 p-0",
				"icon-lg": "size-12 p-0",
			},
		},
		defaultVariants: {
			variant: "primary",
			size: "default",
		},
	})

	export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"]
	export type ButtonSize = VariantProps<typeof buttonVariants>["size"]

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant
			size?: ButtonSize
		}
</script>

<script lang="ts">
	let {
		class: className,
		variant = "primary",
		size = "default",
		ref = $bindable(null),
		href = undefined,
		type = "button",
		disabled = $bindable(),
		children,
		...restProps
	}: ButtonProps = $props()
</script>

{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		href={disabled ? undefined : href}
		aria-disabled={disabled}
		role={disabled ? "link" : undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		{type}
		{disabled}
		{...restProps}>
		{@render children?.()}
	</button>
{/if}
