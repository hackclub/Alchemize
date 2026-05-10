interface Data {
    id: string,
    email: string,
}

type HackatimeProject = {
    name?: string
    project_name?: string
    project?: string
    total_seconds?: number
}

export const getDataFromAccessToken = async (accessToken: string): Promise<Data> => {
    if (accessToken === undefined || accessToken === "") {
        return { id: "", email: "" };
    }
    const response = await fetch("https://auth.hackclub.com/api/v1/me", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        }
    })
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.message ?? "Failed to fetch user data from access token");
    }
    return {
        id: data.identity.id,
        email: data.identity.primary_email
    }
}
export function formatHours(totalSeconds: number | undefined): string {
    const hours = (totalSeconds ?? 0) / 3600
    return `${hours.toFixed(1)}hr`
}
export function getHackatimeProjects(payload: unknown): HackatimeProject[] {
    if (!payload || typeof payload !== "object") return []
    const maybeProjects = (payload as { projects?: unknown }).projects
    return Array.isArray(maybeProjects)
        ? (maybeProjects as HackatimeProject[])
        : []
}