import jwt from "jsonwebtoken"
import { error, redirect, type Cookies } from "@sveltejs/kit"
import { ADMIN_JWT_SECRET, USER_JWT_SECRET } from "$env/static/private"
import { getAdminByEmail } from "$lib/db"
import { parseRoles, type AdminRole } from "$lib/roles"
import type { UserAuthToken } from "$lib/types"

// Single place where session cookies are verified. hooks.server.ts runs these once per request and
// stores the result in event.locals; routes only read locals through the require* helpers below.

export const USER_TOKEN_VERSION = 3
// Lifetime of a user session. Enforced with `maxAge` (from the token's iat), so tokens issued with the
// old 120-day expiry also stop working after this long.
export const USER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

export const verifyUserToken = (token: string | undefined): UserAuthToken | null => {
	if (!token) return null
	try {
		const decoded = jwt.verify(token, USER_JWT_SECRET, {
			algorithms: ["HS256"],
			maxAge: USER_SESSION_MAX_AGE_SECONDS,
		}) as UserAuthToken
		if (decoded.version !== USER_TOKEN_VERSION || typeof decoded.email !== "string" || decoded.email === "") {
			return null
		}
		return decoded
	} catch {
		return null
	}
}

export const signUserToken = (payload: UserAuthToken): string =>
	jwt.sign(payload, USER_JWT_SECRET, { algorithm: "HS256", expiresIn: USER_SESSION_MAX_AGE_SECONDS })

export interface AdminSession {
	slackId: string
	email: string
	name: string
	roles: string
	isReviewer: boolean
	isT2Reviewer: boolean
	isSuperAdmin: boolean
	isFulfiller: boolean
	isShopManager: boolean
}

// The admin JWT only proves who the admin is. Roles are re-read from the admins table on every request,
// so a role removed by a super-admin takes effect immediately instead of when the 6h token expires.
export const getAdminSession = async (cookies: Cookies): Promise<AdminSession | null> => {
	const token = cookies.get("admin_jwt")
	if (!token) return null
	let claims: { email?: unknown, slackId?: unknown }
	try {
		claims = jwt.verify(token, ADMIN_JWT_SECRET, { algorithms: ["HS256"] }) as typeof claims
	} catch {
		return null
	}
	if (typeof claims.email !== "string" || typeof claims.slackId !== "string" || claims.slackId === "") {
		return null
	}
	const adminResponse = await getAdminByEmail(claims.email)
	const record = (await adminResponse.json()).records?.[0]?.fields
	// The row must still exist and still belong to the same Slack account the token was issued for
	if (!record || record.slackId !== claims.slackId) {
		return null
	}
	const roles = parseRoles(record.roles)
	return {
		slackId: record.slackId,
		email: record.email,
		name: record.name,
		roles: record.roles,
		isReviewer: roles.has("reviewer"),
		isT2Reviewer: roles.has("t2_reviewer"),
		isSuperAdmin: roles.has("super_admin"),
		isFulfiller: roles.has("fulfiller"),
		isShopManager: roles.has("shop_manager"),
	}
}

const hasAdminRole = (admin: AdminSession, role: AdminRole): boolean => parseRoles(admin.roles).has(role)

// For admin page loads: anyone without the role is sent to the admin login page
export const requireAdminPage = (locals: App.Locals, role?: AdminRole): AdminSession => {
	if (!locals.admin || (role && !hasAdminRole(locals.admin, role))) {
		throw redirect(303, "/admin/login")
	}
	return locals.admin
}

// For admin endpoints and form actions
export const requireAdminApi = (locals: App.Locals, role?: AdminRole): AdminSession => {
	if (!locals.admin) {
		throw error(401, "Unauthorized, please log in again")
	}
	if (role && !hasAdminRole(locals.admin, role)) {
		throw error(403, "Forbidden")
	}
	return locals.admin
}

// For user page loads: no valid session means logging in again
export const requireUserPage = (locals: App.Locals): UserAuthToken => {
	if (!locals.user) {
		throw redirect(302, "/auth")
	}
	return locals.user
}

// For user endpoints and form actions
export const requireUserApi = (locals: App.Locals): UserAuthToken => {
	if (!locals.user) {
		throw error(401, "Your session has expired, please log in again")
	}
	return locals.user
}
