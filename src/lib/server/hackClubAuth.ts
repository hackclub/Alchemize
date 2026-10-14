import crypto from "crypto"
import jwt from "jsonwebtoken"
import type { Cookies } from "@sveltejs/kit"

export const HACK_CLUB_AUTH_ISSUER = "https://auth.hackclub.com"
const JWKS_URL = `${HACK_CLUB_AUTH_ISSUER}/oauth/discovery/keys`
const JWKS_CACHE_MS = 10 * 60 * 1000

// ---- OAuth state (CSRF protection for every OAuth callback) -------------------------------------------------
// The state is a random value stored in a short-lived httpOnly cookie and sent through the provider; the callback
// only accepts a code that comes back with the same state. Without it, an attacker can send a victim a callback
// URL carrying the attacker's own code (logging the victim in as the attacker, or linking the attacker's account).

const STATE_MAX_AGE_SECONDS = 600

export const createOAuthState = (cookies: Cookies, cookieName: string): string => {
	const state = crypto.randomBytes(16).toString("hex")
	cookies.set(cookieName, state, {
		path: "/",
		httpOnly: true,
		secure: true,
		// The provider redirects back with a top-level GET navigation, which carries Lax cookies
		sameSite: "lax",
		maxAge: STATE_MAX_AGE_SECONDS,
	})
	return state
}

// Single use: the cookie is cleared whether or not the state matches
export const consumeOAuthState = (cookies: Cookies, cookieName: string, returnedState: string | null): boolean => {
	const stored = cookies.get(cookieName)
	cookies.delete(cookieName, { path: "/" })
	if (!stored || !returnedState || stored.length !== returnedState.length) return false
	return crypto.timingSafeEqual(Buffer.from(stored), Buffer.from(returnedState))
}

// ---- ID token verification ----------------------------------------------------------------------------------

type Jwk = crypto.JsonWebKeyInput["key"] & { kid?: string }

let jwksCache: { keys: Jwk[], fetchedAt: number } | null = null

const fetchJwks = async (force: boolean): Promise<Jwk[]> => {
	if (!force && jwksCache && Date.now() - jwksCache.fetchedAt < JWKS_CACHE_MS) {
		return jwksCache.keys
	}
	const response = await fetch(JWKS_URL, { signal: AbortSignal.timeout(10_000) })
	if (!response.ok) {
		throw new Error(`Fetching Hack Club Auth keys failed with ${response.status}`)
	}
	const body = await response.json()
	if (!Array.isArray(body?.keys)) {
		throw new Error("Hack Club Auth keys response has no keys")
	}
	jwksCache = { keys: body.keys, fetchedAt: Date.now() }
	return body.keys
}

// Verifies an ID token from Hack Club Auth: RS256 signature by the key named in the token's `kid` (refreshing the
// key set once if it is unknown, e.g. after a key rotation), issuer, audience (our OAuth client id) and expiry.
export const verifyHackClubIdToken = async <T extends object>(idToken: unknown, clientId: string): Promise<T> => {
	if (typeof idToken !== "string" || idToken === "") {
		throw new Error("Missing ID token")
	}
	const header = jwt.decode(idToken, { complete: true })?.header
	if (!header || header.alg !== "RS256") {
		throw new Error("ID token is not RS256")
	}
	const findKey = (keys: Jwk[]) =>
		header.kid ? keys.find(key => key.kid === header.kid) : keys.length === 1 ? keys[0] : undefined
	let jwk = findKey(await fetchJwks(false))
	if (!jwk) {
		jwk = findKey(await fetchJwks(true))
	}
	if (!jwk) {
		throw new Error(`No Hack Club Auth key matches kid ${header.kid}`)
	}
	const publicKey = crypto.createPublicKey({ key: jwk, format: "jwk" })
	return jwt.verify(idToken, publicKey, {
		algorithms: ["RS256"],
		issuer: HACK_CLUB_AUTH_ISSUER,
		audience: clientId,
	}) as T
}
