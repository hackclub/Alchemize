<main
	class="flex gap-4 bg-gradbg p-4 w-screen h-screen overflow-hidden text-foreground"
>
	<div class="-z-10 fixed inset-0 bg-black/60"></div>

	<div class="flex flex-col gap-4 w-full h-full">
		<div
			class="flex justify-between items-center bg-background/40 backdrop-blur px-6 py-4 border border-white/10 rounded-2xl"
		>
			<div class="flex items-center gap-4">
				<div
					class="bg-primary/40 border-2 border-primary rounded-full w-12 h-12"
				></div>
				<div>
					<p class="font-alchemize text-foreground text-lg">Alchemist</p>
					<p class="text-muted-foreground text-xs">alchemist@example.com</p>
				</div>
			</div>
			<div
				class="font-alchemize text-primary text-2xl flex items-center gap-x-4"
			>
				Alchemize
				<img src="/Alchemist.webp" alt="" class="w-10 h-10" />
			</div>
		</div>

		<div class="gap-4 grid grid-cols-3">
			<div
				class="flex flex-col gap-2 bg-background/40 backdrop-blur p-5 border border-white/10 rounded-2xl"
			>
				<p class="text-muted-foreground text-xs uppercase tracking-widest">
					Hackatime
				</p>
				<div class="flex items-center gap-2">
					<div class="bg-green-500 rounded-full w-2 h-2 animate-pulse"></div>
					<span class="font-alchemize text-foreground text-lg">Connected</span>
				</div>
			</div>
			<div
				class="flex flex-col gap-2 bg-background/40 backdrop-blur p-5 border border-white/10 rounded-2xl"
			>
				<p class="text-muted-foreground text-xs uppercase tracking-widest">
					GitHub
				</p>
				<div class="flex items-center gap-2">
					<div class="bg-yellow-500 rounded-full w-2 h-2 animate-pulse"></div>
					<span class="font-alchemize text-foreground text-lg">Not linked</span>
				</div>
			</div>
			<div
				class="flex flex-col gap-2 bg-background/40 backdrop-blur p-5 border border-white/10 rounded-2xl"
			>
				<p class="text-muted-foreground text-xs uppercase tracking-widest">
					Projects
				</p>
				<span class="font-alchemize text-foreground text-3xl">0</span>
			</div>
		</div>

		<div class="flex-1 gap-4 grid grid-cols-2 min-h-0">
			<div
				class="flex flex-col gap-4 bg-background/40 backdrop-blur p-5 border border-white/10 rounded-2xl"
			>
				<h2 class="font-alchemize text-primary text-lg">Recent Projects</h2>
				<div class="flex flex-col flex-1 gap-2 overflow-y-auto">
					<div
						class="bg-white/5 hover:bg-white/10 p-4 border border-white/5 rounded-xl transition-colors cursor-pointer"
					>
						<p class="font-alchemize text-foreground text-sm">
							No projects yet
						</p>
						<p class="mt-1 text-muted-foreground text-xs">
							Start building something!
						</p>
					</div>
				</div>
				<a
					href="/dashboard/projects"
					class="self-end text-primary text-xs hover:underline">View all →</a
				>
			</div>

			<div class="flex flex-col gap-4">
				<div
					class="flex flex-col flex-1 gap-3 bg-background/40 backdrop-blur p-5 border border-white/10 rounded-2xl"
				>
					<h2 class="font-alchemize text-primary text-lg">Quick Actions</h2>
					<div class="gap-2 grid grid-cols-2">
						<a
							href="/dashboard/projects"
							class="flex flex-col justify-center items-center gap-2 bg-white/5 hover:bg-primary/20 p-4 border border-white/10 hover:border-primary/50 rounded-xl transition-all"
						>
							<span class="text-2xl">⚗️</span>
							<span class="font-alchemize text-foreground text-xs"
								>Projects</span
							>
						</a>
						<a
							href="/dashboard/shop"
							class="flex flex-col justify-center items-center gap-2 bg-white/5 hover:bg-primary/20 p-4 border border-white/10 hover:border-primary/50 rounded-xl transition-all"
						>
							<span class="text-2xl">🛒</span>
							<span class="font-alchemize text-foreground text-xs">Shop</span>
						</a>
						<a
							href="/dashboard/exchange"
							class="flex flex-col justify-center items-center gap-2 bg-white/5 hover:bg-primary/20 p-4 border border-white/10 hover:border-primary/50 rounded-xl transition-all"
						>
							<span class="text-2xl">🔁</span>
							<span class="font-alchemize text-foreground text-xs"
								>Exchange</span
							>
						</a>
						<a
							href="/dashboard/projects"
							class="flex flex-col justify-center items-center gap-2 bg-white/5 hover:bg-primary/20 p-4 border border-white/10 hover:border-primary/50 rounded-xl transition-all"
						>
							<span class="text-2xl">➕</span>
							<span class="font-alchemize text-foreground text-xs"
								>New Project</span
							>
						</a>
					</div>
				</div>

				<div
					class="flex flex-col gap-2 bg-background/40 backdrop-blur p-5 border border-white/10 rounded-2xl"
				>
					<h2 class="font-alchemize text-primary text-lg">Currency</h2>
					<div class="gap-2 grid grid-cols-2">
						<div class="flex items-center gap-2">
							<span class="text-lg">🔴</span>
							<div>
								<p class="text-muted-foreground text-xs">Redstone</p>
								<p class="font-alchemize text-foreground">0</p>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<span class="text-lg">🟡</span>
							<div>
								<p class="text-muted-foreground text-xs">Glowstone</p>
								<p class="font-alchemize text-foreground">0</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</main>
