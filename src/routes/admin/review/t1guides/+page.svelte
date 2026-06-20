<script>
	import {
		Shield,
		FolderGit2,
		Clock3,
		SearchCode,
		CirclePlay,
		MessageSquareText,
		Boxes,
		FileWarning,
		CheckCircle,
		Undo2,
		XCircle,
	} from "lucide-svelte"
</script>

<main
	class="h-screen max-h-screen w-full overflow-hidden flex flex-col md:flex-row bg-black/20"
>
	<aside
		class="w-full md:w-64 xl:w-64 border-b md:border-b-0 md:border-r-3 border-zinc-600 p-6 shrink-0 md:pt-16 bg-black/30"
	>
		<a
			href="/admin/review"
			class="absolute top-2 left-2 hover:bg-zinc-900 p-1 rounded-md"
		>
			<Undo2 />
		</a>
		<div class="md:sticky md:top-16">
			<span
				class="text-xs font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-1.5 mb-2"
			>
				Alchemize
			</span>
			<h2 class="text-xl font-bold mb-6 text-white">Review Guide</h2>

			<nav class="space-y-1 text-sm text-zinc-400">
				<a
					href="#fraud"
					class="flex items-center gap-2.5 p-2 hover:bg-zinc-900 rounded-md hover:text-white transition-colors"
				>
					<Shield class="w-4 h-4 text-rose-500" /> Fraud Check
				</a>
				<a
					href="#repo"
					class="flex items-center gap-2.5 p-2 hover:bg-zinc-900 rounded-md hover:text-white transition-colors"
				>
					<FolderGit2 class="w-4 h-4 text-indigo-400" /> Repo, Demo and Readme
				</a>
				<a
					href="#hours"
					class="flex items-center gap-2.5 p-2 hover:bg-zinc-900 rounded-md hover:text-white transition-colors"
				>
					<Clock3 class="w-4 h-4 text-amber-400" /> Project Hours
				</a>
				<a
					href="#code"
					class="flex items-center gap-2.5 p-2 hover:bg-zinc-900 rounded-md hover:text-white transition-colors"
				>
					<SearchCode class="w-4 h-4 text-sky-400" /> AI Detection
				</a>
				<a
					href="#testing"
					class="flex items-center gap-2.5 p-2 hover:bg-zinc-900 rounded-md hover:text-white transition-colors"
				>
					<CirclePlay class="w-4 h-4 text-emerald-400" /> Demo Testing
				</a>
				<a
					href="#feedback"
					class="flex items-center gap-2.5 p-2 hover:bg-zinc-900 rounded-md hover:text-white transition-colors"
				>
					<MessageSquareText class="w-4 h-4 text-purple-400" /> User Feedback
				</a>
				<a
					href="#specifics"
					class="flex items-center gap-2.5 p-2 hover:bg-zinc-900 rounded-md hover:text-white transition-colors"
				>
					<Boxes class="w-4 h-4 text-teal-400" /> Project Types Guide
				</a>
			</nav>
		</div>
	</aside>

	<div
		class="flex-1 overflow-y-auto p-6 md:p-12 lg:p-16 max-w-4xl mx-auto space-y-12 pb-32 scroll-smooth scrollbar-none!"
	>
		<header class="border-b border-zinc-900 pb-6 md:pt-4">
			<h1 class="text-3xl font-extrabold tracking-tight text-white mb-3">
				Alchemize Review Guide
			</h1>
			<p class="text-zinc-400 leading-relaxed">
				Hey <span
					class="bg-zinc-900 text-amber-400 px-1.5 py-0.5 rounded font-mono text-sm"
					>alchinspectors</span
				>! This guide covers how to properly review project submissions for our
				YSWS. Read it fully before you start reviewing.
			</p>
		</header>

		<section
			id="fraud"
			class="bg-rose-950/30 border border-rose-900/30 rounded-xl p-6 space-y-3"
		>
			<div class="flex items-center gap-2 text-rose-400 font-bold text-lg">
				<Shield class="w-5 h-5" />
				<h2>1. Fraud Check First. Always.</h2>
			</div>
			<p class="text-zinc-300 text-sm">
				Before you touch anything else, check for any fraud signs:
			</p>
			<ul class="list-disc pl-5 text-sm text-zinc-400 space-y-1.5">
				<li>
					If hours are suspicious
					<span class="text-rose-400">→ deflate them </span>.
				</li>
				<li>
					If project is vibecoded
					<span class="text-rose-400">→ deflate hours </span>
					<strong> (If it's almost fully vibecoded, reject it). </strong>
				</li>
			</ul>
			<p
				class="text-xs bg-rose-950/40 text-rose-300 p-2.5 rounded border border-rose-900/40 font-medium"
			>
				Fraud flags are law. Do not skip this step.
			</p>
		</section>

		<section id="repo" class="space-y-4">
			<div
				class="flex items-center gap-2 text-white font-bold text-xl border-b border-zinc-900 pb-2"
			>
				<FolderGit2 class="w-5 h-5 text-indigo-400" />
				<h2>2. GitHub Repo + Demo + Project Description</h2>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div
					class="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl space-y-2"
				>
					<h3 class="font-bold text-zinc-200 text-sm tracking-wide uppercase">
						GitHub Repository
					</h3>
					<ul class="text-xs text-zinc-400 space-y-2 list-disc pl-4">
						<li>Must have actual code (Reject completely empty repos).</li>
						<li>
							Must have a
							<strong> human-written README </strong>
							detailing what it does, stack used, and an AI declaration. (if used)
						</li>
						<li>If the README looks like AI slop, request changes.</li>
					</ul>
				</div>

				<div
					class="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl space-y-2"
				>
					<h3 class="font-bold text-zinc-200 text-sm tracking-wide uppercase">
						The Demo
					</h3>
					<ul class="text-xs text-zinc-400 space-y-2 list-disc pl-4">
						<li>Demo must work ofc. If it doesn't, request changes.</li>
						<li>
							Websites must be publicly accessible with no access codes (unless
							it's a demo account for a system, that's fine, just ask them for a
							access code then)
						</li>
						<li>Google drive links are not allowed.</li>
						<li>Video demos are only okay if accompanied by hardware.</li>
						<li>
							<strong>
								Video demo may be alllowed for a project if it is too complex to
								review. (Ask an org before accepting a video demo)
							</strong>
						</li>
					</ul>
				</div>
			</div>

			<div class="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
				<h3 class="font-bold text-zinc-200 text-sm tracking-wide uppercase">
					AI Slop filter
				</h3>
				<p class="text-sm text-zinc-300 mb-3">
					Request changes or instantly reject if hosted on or made entirely via:
				</p>
				<div class="flex flex-wrap gap-2 text-xs font-mono">
					<span
						class="bg-zinc-950 px-2 py-1 rounded border border-zinc-800 text-zinc-400"
						>v0.dev</span
					>
					<span
						class="bg-zinc-950 px-2 py-1 rounded border border-zinc-800 text-zinc-400"
						>Lovable</span
					>
					<span
						class="bg-zinc-950 px-2 py-1 rounded border border-zinc-800 text-zinc-400"
						>Bolt.new</span
					>
					<span
						class="bg-zinc-950 px-2 py-1 rounded border border-zinc-800 text-zinc-400"
						>onRender (Free Tier)</span
					>
				</div>
				<p class="text-xs text-zinc-500 mt-3 font-semibold">
					If the entire project is AI slop with near-zero human effort, reject
					immediately.
				</p>
			</div>
		</section>

		<section id="hours" class="space-y-3">
			<div
				class="flex items-center gap-2 text-white font-bold text-xl border-b border-zinc-900 pb-2"
			>
				<Clock3 class="w-5 h-5 text-amber-400" />
				<h2>3. Project Hours Inspection</h2>
			</div>
			<p class="text-sm text-zinc-400">
				Catch the inflated nonsense with these rules:
			</p>
			<ul class="list-disc pl-5 text-sm text-zinc-300 space-y-2">
				<li>
					Deflate hours logged automatically by Hackatime from non-code tasks.
				</li>
				<li>
					Deflate hours that make zero sense (e.g., 80 hours spent building a
					200-line static HTML file).
				</li>
			</ul>
			<div
				class="p-3 bg-amber-950/10 border border-amber-900/30 text-amber-300 rounded-lg text-sm italic"
			>
				"If something feels inflated, it probably is. Trust your gut."
				-@adicoding-js
			</div>
		</section>

		<section id="code" class="space-y-3">
			<div
				class="flex items-center gap-2 text-white font-bold text-xl border-b border-zinc-900 pb-2"
			>
				<SearchCode class="w-5 h-5 text-sky-400" />
				<h2>4. Code Review & AI Usage</h2>
			</div>
			<div
				class="bg-zinc-900/60 p-5 rounded-xl space-y-3 text-sm text-zinc-300"
			>
				<p class="font-medium text-white">Look for AI Fingerprints:</p>
				<ul class="list-disc pl-5 space-y-1 text-zinc-400 text-xs">
					<li>
						Suspiciously perfect structure, copy-paste patterns and weird
						comments
					</li>
					<li>
						Weird generic placeholders left as they are (eg, <code
							class="bg-zinc-950 text-sky-400 px-1 py-0.5 rounded"
							>api_key = "your_api_key"</code
						>).
					</li>
					<li>Zero personal style or ai generated git commit patterns.</li>
					<li>
						Compare complexity vs claimed hours, a basic HTML page does not take
						10 hours.
					</li>
					<li>
						If the project is clearly AI-heavy with inflated hours, deflate by
						~50% or more.
					</li>
					<li>
						Check update logs and AI declarations, make sure they're honest.
					</li>
				</ul>
				<p class="text-zinc-400 pt-2 border-t border-zinc-800">
					If dishonesty is found regarding AI usage disclosures, <span
						class="text-zinc-200 font-semibold">request changes</span
					> asking them to update their AI declaration.
				</p>
			</div>
		</section>

		<section id="testing" class="space-y-4">
			<div
				class="flex items-center gap-2 text-white font-bold text-xl border-b border-zinc-900 pb-2"
			>
				<CirclePlay class="w-5 h-5 text-emerald-400" />
				<h2>5. Demo Testing Guidelines</h2>
			</div>
			<p class="text-sm text-zinc-400 font-medium text-emerald-400">
				Run the project locally or via live demo link. Never trust a video
				snippet.
			</p>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
				<div
					class="bg-zinc-900/40 p-4 border border-zinc-800 rounded-lg space-y-2"
				>
					<span class="text-zinc-200 font-bold uppercase tracking-wider block"
						>Environment Sandbox</span
					>
					<p class="text-zinc-400">
						For cross-OS or potentially risky executables (e.g., testing Linux
						ships on Windows layouts), run them cleanly using inside <strong
							>QEMU</strong
						>
						or <strong>VirtualBox</strong> VMs.
					</p>
				</div>
				<div
					class="bg-zinc-900/40 p-4 border border-zinc-800 rounded-lg space-y-2"
				>
					<span class="text-zinc-200 font-bold uppercase tracking-wider block"
						>Allowed Platforms</span
					>
					<ul class="list-disc pl-4 text-zinc-400 space-y-1">
						<li><strong>Games:</strong> itch.io or GitHub Releases</li>
						<li>
							<strong>Websites:</strong> Vercel, GitHub Pages (No onRender tier)
						</li>
						<li><strong>CLIs:</strong> Built packages on npm or PyPI</li>
					</ul>
				</div>
			</div>
		</section>

		<section id="feedback" class="space-y-4">
			<div
				class="flex items-center gap-2 text-white font-bold text-xl border-b border-zinc-900 pb-2"
			>
				<MessageSquareText class="w-5 h-5 text-purple-400" />
				<h2>6. User Feedback</h2>
			</div>
			<p class="text-sm text-zinc-400">
				Keep responses completely formal, highly precise, and completely
				error-free. <span class="text-rose-400"
					>Avoid slang like 'lol' or 'lmao'.</span
				>
			</p>

			<div class="space-y-3">
				<div
					class="border border-emerald-900/40 bg-emerald-950/10 rounded-xl p-4 space-y-2"
				>
					<div
						class="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wide"
					>
						<CheckCircle class="w-4 h-4" /> Approval Format
					</div>
					<pre
						class="bg-zinc-950 text-zinc-300 p-3 rounded-lg font-mono text-xs whitespace-pre-wrap">"Hey! Your project ABC was awesome. X and Y were really nice. All hours were approved / deflated X hours because of &lt;reason&gt;. One small note: &lt;non-critical issue&gt;. Keep it up!"</pre>
				</div>

				<div
					class="border border-rose-900/40 bg-rose-950/10 rounded-xl p-4 space-y-2"
				>
					<div
						class="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wide"
					>
						<XCircle class="w-4 h-4" /> Rejection / Changes Format
					</div>
					<pre
						class="bg-zinc-950 text-zinc-300 p-3 rounded-lg font-mono text-xs whitespace-pre-wrap">"Hey! Cool project ABC, but there are some things we would like you to change. 
    1. &lt;item 1&gt; 
    2. &lt;item 2&gt;
Please reship after implementing these changes and we will take another look at it. Thanks!"</pre>
				</div>
			</div>
		</section>

		<section id="specifics" class="space-y-4">
			<div
				class="flex items-center gap-2 text-white font-bold text-xl border-b border-zinc-900 pb-2"
			>
				<Boxes class="w-5 h-5 text-teal-400" />
				<h2>7. Specific Project Types</h2>
			</div>

			<div class="overflow-x-auto border border-zinc-900 rounded-xl">
				<table class="w-full text-left text-sm text-zinc-400">
					<thead
						class="bg-zinc-900 text-xs text-zinc-200 uppercase tracking-wider font-semibold"
					>
						<tr>
							<th class="p-4">Project Type</th>
							<th class="p-4">Submission Requirements & Rule Set</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-zinc-900 text-xs">
						<tr class="hover:bg-zinc-900/20">
							<td class="p-4 font-bold text-white whitespace-nowrap"
								>Web Apps</td
							>
							<td class="p-4 text-zinc-300"
								>Allowed: Live deployment required (Vercel, GitHub Pages,
								Netlify).
								<strong>
									Strictly Not ALlowed: Render, Railway, Hugging Face,
									local-only scripts, ngrok, or DuckDNS tunnels.
								</strong>
							</td>
						</tr>
						<tr class="hover:bg-zinc-900/20">
							<td class="p-4 font-bold text-white whitespace-nowrap"
								>Executables</td
							>
							<td class="p-4 text-zinc-300"
								>Must be hosted inside GitHub Releases directly as a compiled <code
									class="bg-zinc-900 px-1 py-0.5 rounded">.exe</code
								>, <code class="bg-zinc-900 px-1 py-0.5 rounded">.app</code>, or
								<code class="bg-zinc-900 px-1 py-0.5 rounded">.deb</code> package
								with step-by-step setup docs.</td
							>
						</tr>
						<tr class="hover:bg-zinc-900/20">
							<td class="p-4 font-bold text-white whitespace-nowrap"
								>Mobile (Android/iOS)</td
							>
							<td class="p-4 text-zinc-300"
								><strong class="text-zinc-200">Android:</strong> Production APK
								inside releases or Play Store link. <br /><strong
									class="text-zinc-200">iOS:</strong
								> TestFlight links only. If they lack an Apple Dev setup, ping Amber
								to register them to Hack Club's team account.</td
							>
						</tr>
						<tr class="hover:bg-zinc-900/20">
							<td class="p-4 font-bold text-white whitespace-nowrap"
								>APIs & Bots</td
							>
							<td class="p-4 text-zinc-300"
								><strong class="text-zinc-200">APIs:</strong> Must be testable
								live via a frontend sandbox like Swagger. <br /><strong
									class="text-zinc-200">Bots:</strong
								> Must be fully deployed online (cannot be hosted by us). Demo link
								must lead to an active channel with full runtime configuration guides.</td
							>
						</tr>
						<tr class="hover:bg-zinc-900/20">
							<td class="p-4 font-bold text-white whitespace-nowrap"
								>Libraries</td
							>
							<td class="p-4 text-zinc-300"
								>Must be published to a valid registry ecosystem manager (npm,
								PyPI) instead of a raw release. Reviewers must trace functional
								usage manually or look over a sample implementation app.</td
							>
						</tr>
						<tr class="hover:bg-zinc-900/20 text-zinc-500">
							<td
								class="p-4 font-bold whitespace-nowrap flex items-center gap-1.5"
							>
								Hardware
								<span
									class="text-[10px] bg-zinc-800 text-zinc-400 px-1 rounded font-normal"
									>Season 2 maybe....</span
								>
							</td>
							<td class="p-4 text-zinc-500 italic"
								>Valid: Completed schematics/PCBs tracked via hackatime,
								soldering timelapses, or physical breadboard wiring sheets.
								Invalid: Mere breadboard adjustments or mock simulations.</td
							>
						</tr>
					</tbody>
				</table>
			</div>
		</section>
	</div>
</main>
