import type { Handle, RequestEvent } from "@sveltejs/kit"
import { PUBLIC_TURNED_OFF } from "$env/static/public"
import { PII_ENCRYPTION_KEY } from "$env/static/private"
import { getAdminSession, verifyUserToken } from "$lib/server/auth"
import { consumeRateLimit, findRateLimitRule } from "$lib/server/rateLimit"
import crypto from "node:crypto"

// Safety net: an unhandled rejection terminates Node by default, taking the whole site down.
// Registering a handler keeps the process alive; the underlying bug still gets logged.
const processFlags = globalThis as typeof globalThis & {
	__alchemizeRejectionLogger?: boolean
	__alchemizePiiKeyChecked?: boolean
}
if (!processFlags.__alchemizeRejectionLogger) {
	processFlags.__alchemizeRejectionLogger = true
	process.on("unhandledRejection", reason => {
		console.error("Unhandled promise rejection:", reason)
	})
}

// PII_ENCRYPTION_KEY is read from two places: $env/static/private, inlined into the build by adapter-node and used by
// encryptAES/decryptAES in $lib/utils.server (addresses, names, birthdays), and process.env at run time, used by
// $lib/server/hackatimeToken (Hackatime tokens; db.ts imports it, and db.ts is also loaded by drizzle-kit and tsx,
// where $env doesn't exist). When the two differ each caller still reads what the same source wrote, until a row is
// read under the other key and AES-GCM fails with "Unsupported state or unable to authenticate data". So the two are
// compared once at boot and logged as fingerprints (sha256 of the hex key, first 12 characters, the same value as
// `printf '%s' "$PII_ENCRYPTION_KEY" | sha256sum | cut -c1-12`), never as the key itself. Logged, not fatal: refusing
// to boot would take the site down at deploy time, while the rows under the other key fail one at a time with a clear
// error anyway. process.env is populated here: $lib/db (imported through $lib/server/auth) has already run dotenv in
// development.
const HEX_KEY = /^[0-9a-fA-F]{64}$/
const keyFingerprint = (key: string): string => crypto.createHash("sha256").update(key).digest("hex").slice(0, 12)
const piiKeyProblem = (buildKey: string | undefined, runtimeKey: string | undefined): string | null => {
	if (!buildKey || !HEX_KEY.test(buildKey)) {
		return "the build-time PII_ENCRYPTION_KEY (from $env/static/private) is missing or not 32 bytes as 64 hexadecimal characters, so addresses, names and birthdays can't be encrypted or decrypted"
	}
	if (!runtimeKey || !HEX_KEY.test(runtimeKey)) {
		return `process.env.PII_ENCRYPTION_KEY is missing or not 32 bytes as 64 hexadecimal characters at run time, so Hackatime tokens can't be encrypted or decrypted (the build-time key is ${keyFingerprint(buildKey)})`
	}
	// Buffer.from(hex) ignores case, so keys that differ only in case encrypt identically
	if (buildKey.toLowerCase() !== runtimeKey.toLowerCase()) {
		return `PII_ENCRYPTION_KEY differs between the build (${keyFingerprint(buildKey)}, used for addresses, names and birthdays) and the run-time environment (${keyFingerprint(runtimeKey)}, used for Hackatime tokens): rows encrypted under one can't be read under the other, and data exists under both. Neither key may change (no rebuild or restart with a different value) until one set of rows has been re-encrypted under the other key`
	}
	return null
}
if (!processFlags.__alchemizePiiKeyChecked) {
	processFlags.__alchemizePiiKeyChecked = true
	const problem = piiKeyProblem(PII_ENCRYPTION_KEY, process.env.PII_ENCRYPTION_KEY)
	if (problem) {
		console.error(`PII_ENCRYPTION_KEY problem: ${problem}`)
	} else {
		console.info(`PII_ENCRYPTION_KEY ${keyFingerprint(PII_ENCRYPTION_KEY)} is the same at build and run time`)
	}
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
