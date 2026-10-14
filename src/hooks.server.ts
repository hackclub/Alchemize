import type { Handle, RequestEvent } from "@sveltejs/kit"
import { PUBLIC_TURNED_OFF } from "$env/static/public"
import { getAdminSession, verifyUserToken } from "$lib/server/auth"
import { consumeRateLimit, findRateLimitRule } from "$lib/server/rateLimit"

// Safety net: an unhandled rejection terminates Node by default, taking the whole site down.
// Registering a handler keeps the process alive; the underlying bug still gets logged.
const processFlags = globalThis as typeof globalThis & { __alchemizeRejectionLogger?: boolean }
if (!processFlags.__alchemizeRejectionLogger) {
	processFlags.__alchemizeRejectionLogger = true
	process.on("unhandledRejection", reason => {
		console.error("Unhandled promise rejection:", reason)
	})
}

const isTurnedOff = PUBLIC_TURNED_OFF !== "false"
// While turned off, these areas reject every state-changing request (form actions and endpoints).
// Page loads keep redirecting to /turned-off from their layouts.
const MAINTENANCE_PREFIXES = ["/dashboard", "/refer", "/hackatime_callback"]
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

const SECURITY_HEADERS: Record<string, string> = {
	// Nothing on this site is meant to be framed (clickjacking protection for the admin panel)
	"Content-Security-Policy": "frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
	"X-Frame-Options": "DENY",
	"X-Content-Type-Options": "nosniff",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Permissions-Policy": "camera=(), microphone=(), geolocation=()",
}

const jsonResponse = (status: number, message: string, headers: Record<string, string> = {}) =>
	new Response(JSON.stringify({ message }), {
		status,
		headers: { "Content-Type": "application/json", ...headers },
	})

// Behind Cloudflare the socket address is Cloudflare's edge, so prefer the client IP it forwards
const clientKey = (event: RequestEvent): string => {
	if (event.locals.user) return `user:${event.locals.user.email}`
	const forwarded = event.request.headers.get("cf-connecting-ip")
	try {
		return `ip:${forwarded ?? event.getClientAddress()}`
	} catch {
		return `ip:${forwarded ?? "unknown"}`
	}
}

const withSecurityHeaders = (response: Response): Response => {
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		try {
			if (!response.headers.has(name)) response.headers.set(name, value)
		} catch {
			// Some responses (e.g. ones proxied straight from fetch) have immutable headers
		}
	}
	return response
}

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url
	const method = event.request.method

	if (isTurnedOff && !SAFE_METHODS.has(method) && MAINTENANCE_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
		return withSecurityHeaders(jsonResponse(503, "Alchemize is turned off for maintenance, please try again later"))
	}

	event.locals.user = verifyUserToken(event.cookies.get("user_token"))
	event.locals.admin = pathname.startsWith("/admin") ? await getAdminSession(event.cookies) : null

	const rule = findRateLimitRule(method, pathname)
	if (rule) {
		const result = consumeRateLimit(`${rule.method} ${rule.path} ${clientKey(event)}`, rule.limit, rule.windowMs)
		if (!result.allowed) {
			return withSecurityHeaders(jsonResponse(429, "Too many requests, please slow down and try again shortly", {
				"Retry-After": String(result.retryAfterSeconds),
			}))
		}
	}

	return withSecurityHeaders(await resolve(event))
}
