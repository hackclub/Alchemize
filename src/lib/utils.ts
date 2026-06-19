import { PUBLIC_HACKATIME_AUTH, PUBLIC_HACKATIME_REDIRECT } from "$env/static/public";
import {currencyValueRelativeToPotionMix} from "./themeCurrencyMaps";
interface Data {
    id: string,
    email: string,
    slack_id?: string
    first_name?: string
    last_name?: string
    verification_status?: string
}

type HackatimeProject = {
    name?: string
    project_name?: string
    project?: string
    total_seconds?: number
}
export const hackatimeAuthUrl = `https://hackatime.hackclub.com/oauth/authorize?client_id=${PUBLIC_HACKATIME_AUTH}&redirect_uri=${encodeURIComponent(PUBLIC_HACKATIME_REDIRECT)}&response_type=code&scope=profile+read`
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
        email: data.identity.primary_email,
        verification_status: data.identity.verification_status,
        first_name: data.identity.first_name,
        last_name: data.identity.last_name,
        slack_id: data.identity.slack_id
    }
}
export function formatHours(totalSeconds: number | undefined): string {
    const hours = (totalSeconds ?? 0) / 3600
    const mins = (totalSeconds ?? 0) % 3600
    return `${Math.floor(hours)}hr ${Math.floor(mins / 60)}min`
}
export function getHackatimeProjects(payload: unknown): HackatimeProject[] {
    if (!payload || typeof payload !== "object") return []
    const maybeProjects = (payload as { projects?: unknown }).projects
    return Array.isArray(maybeProjects)
        ? (maybeProjects as HackatimeProject[])
        : []
}
export const countCharacters = (str: string) => {
    return str.trim().length
}
export const currenciesToPotionMix = (redstone: number, glowstone: number, aquaRegia: number) => {
    let values = currencyValueRelativeToPotionMix
    if (redstone>0 && glowstone<1 && aquaRegia<1) {
        return redstone*values.redstone
    }else if (glowstone>0 && redstone<1 && aquaRegia<1) {
        return glowstone*values.glowstone
    }else if (aquaRegia>0 && redstone<1 && glowstone<1) {
        return aquaRegia*values.aqua_regia
    }
    if (redstone>0 && glowstone>0 && aquaRegia<1) {
        const bonus = Math.min(redstone*values.bonus, glowstone*values.bonus)
        return redstone*values.redstone + glowstone*values.glowstone + bonus
    }else if (redstone>0 && aquaRegia>0 && glowstone<1) {
        const bonus = Math.min(redstone*values.bonus, aquaRegia*values.bonus)
        return redstone*values.redstone + aquaRegia*values.aqua_regia + bonus
    }else if (glowstone>0 && aquaRegia>0 && redstone<1) {
        const bonus = Math.min(glowstone*values.bonus, aquaRegia*values.bonus)
        return glowstone*values.glowstone + aquaRegia*values.aqua_regia + bonus
    }else{
        const bonus1 = Math.min(redstone*values.bonus, glowstone*values.bonus)
        const bonus2 = Math.min(glowstone*values.bonus, aquaRegia*values.bonus)
        return redstone*values.redstone + glowstone*values.glowstone + aquaRegia*values.aqua_regia + bonus1 + bonus2
    }
}