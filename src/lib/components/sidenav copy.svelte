<script lang="ts">
	import Button from "./ui/button/button.svelte"
	import { Blocks, ShoppingBasket, FlaskConical } from "lucide-svelte"
	import { BookDashed } from "lucide-svelte"

	const changeHref = (href: string) => {
		window.location.href = `${href}`
	}
</script>

<div class="smallBlock w-16"></div>
<div
	class="group z-20 absolute w-16 bg-sidebar h-full flex flex-col py-3 px-2 hover:w-64 transition-[width] duration-300 ease-in-out overflow-hidden"
>
	<Button
		variant="ghost"
		class="flex items-center justify-start gap-3 px-3 py-8 w-full mb-16"
		onclick={() => (window.location.href = "/")}
	>
		<img src="/Alchemize.png" alt="" class="h-9 w-9 shrink-0 object-contain" />
		<span
			class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 whitespace-nowrap text-lg text-primary font-semibold"
		>
			Alchemize
		</span>
	</Button>

	<div class="w-full h-full space-y-3">
		<a href="/dashboard">
			<Button
				class="w-full justify-start gap-3 px-3 py-8 text-lg"
				variant="ghost"
				size="lg"
			>
				<BookDashed class="h-8 w-8 shrink-0" />
				<span
					class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 whitespace-nowrap"
				>
					Home
				</span>
			</Button>
		</a>
		<a href="/dashboard/projects">
			<Button
				class="w-full justify-start gap-3 px-3 py-8 text-lg"
				variant="ghost"
				size="lg"
			>
				<Blocks class="h-8 w-8 shrink-0" />
				<span
					class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 whitespace-nowrap"
				>
					Projects
				</span>
			</Button>
		</a>
		<a href="/dashboard/shop">
			<Button
				class="w-full justify-start gap-3 px-3 py-8 text-lg"
				variant="ghost"
				size="lg"
			>
				<ShoppingBasket class="h-8 w-8 shrink-0" />
				<span
					class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 whitespace-nowrap"
				>
					Shop
				</span>
			</Button>
		</a>
		<a href="/dashboard/exchange">
			<Button
				class="w-full justify-start gap-3 px-3 py-8 text-lg"
				variant="ghost"
				size="lg"
			>
				<FlaskConical class="h-8 w-8 shrink-0" />
				<span
					class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 whitespace-nowrap"
				>
					Exchange
				</span>
			</Button>
		</a>
	</div>
</div>
