import type { RequestHandler } from "@sveltejs/kit"
import type { AdminJWT } from "$lib/types"
import {error} from "@sveltejs/kit"
import jwt from "jsonwebtoken"
import { ADMIN_JWT_SECRET } from "$env/static/private"
import { getProjectWithHackatime } from "$lib/db"
import type { Heartbeats } from "$lib/types"
interface FileBreakdown {
    [file: string]: {
        totalMs: number;
        formatted: string;
    };
}
function calculateTimePerFile(
    heartbeats: Heartbeats[],
    maxGapSecs: number = 120
): FileBreakdown {
    if (heartbeats.length === 0) return {};

    const sortedHeartbeats = heartbeats
        .map((hb) => ({
            time: hb.time,
            entity: hb.entity,
        }))
        .filter(
            (hb): hb is { time: number; entity: string } =>
                typeof hb.time === "number" &&
                hb.time > 0 &&
                typeof hb.entity === "string" &&
                hb.entity.trim().length > 0
        )
        .sort((a, b) => a.time - b.time);

    if (sortedHeartbeats.length < 2) return {};

    const fileDurations: Record<string, number> = {};

    for (let i = 1; i < sortedHeartbeats.length; i++) {
        const prev = sortedHeartbeats[i - 1];
        const curr = sortedHeartbeats[i];

        const gapSec = curr.time - prev.time;
        if (gapSec <= 0) continue;

        const activeTime = Math.min(gapSec, maxGapSecs);

        fileDurations[prev.entity] ??= 0;
        fileDurations[prev.entity] += activeTime;
    }

    const breakdown: FileBreakdown = {};

    for (const [file, seconds] of Object.entries(fileDurations)) {
        const totalMs = seconds * 1000;

        breakdown[file] = {
            totalMs : Math.round(totalMs),
            formatted: msToHumanReadable(totalMs),
        };
    }

    return breakdown;
}
function msToHumanReadable(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
    ].join(':');
}
const filterHeartbeatsByHackatimeProject = (heartbeats: Heartbeats[], hackatimeProject: string): Heartbeats[] => {
    const projects = hackatimeProject.split(",")
    return heartbeats.filter(heartbeat => projects.includes(heartbeat.project));
}
const countHeartbeatsByCategory = (heartbeats: Heartbeats[], category: string): number => {
    return heartbeats.filter(heartbeat => heartbeat.category === category).length
}
const heartbeatsToSeconds = (heartbeats: Heartbeats[], maxGapSecs: number = 120): number => {
    const sortedHeartbeats = heartbeats.sort((a, b) => a.time - b.time);
    let totalSeconds = 0;
    for (let i = 1; i < sortedHeartbeats.length; i++) {
        const gapSec = sortedHeartbeats[i].time - sortedHeartbeats[i - 1].time;
        if (gapSec > 0) {
            totalSeconds += Math.min(gapSec, maxGapSecs);
        }
    }
    return totalSeconds;
}
const countSecondsByCategory = (heartbeats: Heartbeats[], category: string, maxGapSecs: number = 120): number => {
    const filteredHeartbeats = heartbeats.filter(heartbeat => heartbeat.category === category);
    return Math.round(heartbeatsToSeconds(filteredHeartbeats, maxGapSecs));
}
const secsPerDay = (heartbeats: Heartbeats[], maxGapSecs: number = 120): Record<string, number> => {
    const dayMap: Record<string, number> = {};
    const sortedHeartbeats = heartbeats.sort((a, b) => a.time - b.time);
    for (let i = 1; i < sortedHeartbeats.length; i++) {
        const key = new Date(sortedHeartbeats[i].time * 1000).toISOString().split('T')[0];
        dayMap[key] ??= 0;
        const previousHeartbeat = sortedHeartbeats[i - 1];
        const gapSec = sortedHeartbeats[i].time - previousHeartbeat.time;
        if (gapSec > 0) {
            dayMap[key] += Math.round(Math.min(gapSec, maxGapSecs));
        }
    }
    return dayMap;
}
export const POST: RequestHandler = async ({ cookies, request }) => {
    const {projectId} = await request.json()
    const adminJWTToken = cookies.get("admin_jwt")
    if (!adminJWTToken) {
        return error(401, "Unauthorized")
    }
    try {
        const decoded = jwt.verify(adminJWTToken, ADMIN_JWT_SECRET) as AdminJWT
        if (!decoded.isT2Reviewer) {
            return error(401, "Unauthorized")
        }
    }  catch (err) {
        return error(401, "Unauthorized")
    }
    const project = await getProjectWithHackatime(projectId);
if (!project.ok) {
    return error(404, "Project not found")
}
    const projectData = (await project.json()).records[0];

    if (!project.ok || !projectData) {
        return error(404, "Project not found")
    }
    // Resolve the creator's Hackatime user id + trust factor from their Slack ID.
    // Non-fatal: review tooling links simply won't render if this lookup fails.
    const identityPromise = (async (): Promise<{ hackatimeUserId: string | null, trustFactor: { trustLevel: string | null, trustValue: number | null } | null }> => {
        const slackId = projectData.fields.slackId
        if (!slackId) return { hackatimeUserId: null, trustFactor: null }
        try {
            const statsResponse = await fetch(`https://hackatime.hackclub.com/api/v1/users/${encodeURIComponent(slackId)}/stats`)
            if (!statsResponse.ok) return { hackatimeUserId: null, trustFactor: null }
            const stats = await statsResponse.json()
            const rawTrust = stats?.trust_factor ?? stats?.data?.trust_factor
            return {
                hackatimeUserId: stats?.data?.user_id != null ? String(stats.data.user_id) : null,
                trustFactor: rawTrust ? {
                    trustLevel: rawTrust.trust_level ?? null,
                    trustValue: rawTrust.trust_value ?? null
                } : null
            }
        } catch {
            return { hackatimeUserId: null, trustFactor: null }
        }
    })()
    const fetchUserTokens = await fetch(`https://hackatime.hackclub.com/api/v1/authenticated/api_keys`,{
        headers: {
            "Authorization": `Bearer ${projectData.fields.hackatimeToken}`
        }
    })
    const token = (await fetchUserTokens.json()).token
    if (!fetchUserTokens.ok || !token) {
        return error(500, "Failed to fetch Hackatime API token")
    }
    const heartbeatRespose = await fetch(`https://hackatime.hackclub.com/api/v1/my/heartbeats?start_time=2026-06-18`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    const heartbeatData = await heartbeatRespose.json()
    const filteredHeartbeats = filterHeartbeatsByHackatimeProject(heartbeatData.heartbeats, projectData.fields.hackatime)
    if (!heartbeatRespose.ok || !filteredHeartbeats) {
        return error(500, "Failed to fetch Hackatime heartbeats")
    }
    const aiCat = "ai coding"
    const building = "building"
    const timelapsing = "timelapsing"
    const coding = "coding"
    const aiSec = countSecondsByCategory(filteredHeartbeats, aiCat)
    const buildingSec = countSecondsByCategory(filteredHeartbeats, building)
    const timelapsingSec = countSecondsByCategory(filteredHeartbeats, timelapsing)
    const codingSec = countSecondsByCategory(filteredHeartbeats, coding)
    const byFile = calculateTimePerFile(filteredHeartbeats)
    const dayMap = secsPerDay(filteredHeartbeats)
    const { hackatimeUserId, trustFactor } = await identityPromise
    return new Response(JSON.stringify({
        hackatimeProject: projectData.fields.hackatime,
        hackatimeUserId,
        trustFactor,
        aiSec,
        buildingSec,
        timelapsingSec,
        codingSec,
        others: heartbeatsToSeconds(filteredHeartbeats) - (aiSec + buildingSec + timelapsingSec + codingSec),
        perFileBreakdown: byFile,
        dayMap
    }), { status: 200 })


}