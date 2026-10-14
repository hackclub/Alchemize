// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { AdminSession } from "$lib/server/auth"
import type { UserAuthToken } from "$lib/types"

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			// Verified user session from the user_token cookie (set in hooks.server.ts)
			user: UserAuthToken | null
			// Verified admin session with roles read from the DB; only resolved for /admin routes
			admin: AdminSession | null
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
