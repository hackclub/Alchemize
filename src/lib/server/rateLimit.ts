// In-memory fixed-window rate limiter. The app runs as a single Node process, so per-process state is
// enough to stop request floods (Slack notification spam, DB writes); it resets on restart by design.

interface Bucket {
	count: number
	resetAt: number
}

const buckets = new Map<string, Bucket>()
let nextSweepAt = 0

export interface RateLimitResult {
	allowed: boolean
	retryAfterSeconds: number
}

export const consumeRateLimit = (key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult => {
	// Drop expired buckets at most once a minute so the map cannot grow without bound
	if (now >= nextSweepAt) {
		for (const [bucketKey, bucket] of buckets) {
			if (bucket.resetAt <= now) buckets.delete(bucketKey)
		}
		nextSweepAt = now + 60_000
	}
	let bucket = buckets.get(key)
	if (!bucket || bucket.resetAt <= now) {
		bucket = { count: 0, resetAt: now + windowMs }
		buckets.set(key, bucket)
	}
	bucket.count++
	return {
		allowed: bucket.count <= limit,
		retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
	}
}

export interface RateLimitRule {
	method: string
	path: string
	limit: number
	windowMs: number
}

const TEN_MINUTES = 10 * 60_000

// Matched on exact pathname. Logged-in requests are keyed by user, anonymous ones by client IP.
export const RATE_LIMIT_RULES: RateLimitRule[] = [
	{ method: "POST", path: "/forms/nps", limit: 5, windowMs: TEN_MINUTES },
	{ method: "POST", path: "/dashboard/projects/ship", limit: 10, windowMs: TEN_MINUTES },
	{ method: "POST", path: "/dashboard/shop/order", limit: 20, windowMs: TEN_MINUTES },
	// Project create/update form actions
	{ method: "POST", path: "/dashboard/projects", limit: 30, windowMs: TEN_MINUTES },
	{ method: "DELETE", path: "/dashboard/projects/delete", limit: 30, windowMs: TEN_MINUTES },
]

export const findRateLimitRule = (method: string, pathname: string): RateLimitRule | undefined =>
	RATE_LIMIT_RULES.find(rule => rule.method === method && rule.path === pathname)
