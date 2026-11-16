// Admin roles are stored in admins.roles as a comma-separated list, e.g. "reviewer,t2_reviewer,"
export const ADMIN_ROLES = ["reviewer", "super_admin", "fulfiller", "t2_reviewer", "shop_manager"] as const
export type AdminRole = (typeof ADMIN_ROLES)[number]

// Slack user IDs: U… for regular users, W… for Enterprise Grid users
export const SLACK_USER_ID_PATTERN = /^[UW][A-Z0-9]{6,20}$/

// Exact role names only: a substring check would read "t2_reviewer" as also granting "reviewer"
export const parseRoles = (roles: string | null | undefined): Set<string> =>
	new Set(
		(roles ?? "")
			.split(",")
			.map(role => role.trim())
			.filter(Boolean)
	)

export const hasRole = (roles: string | null | undefined, role: AdminRole): boolean => parseRoles(roles).has(role)
