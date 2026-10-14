import {getNPSResults} from "$lib/db";
import { requireAdminPage } from "$lib/server/auth"
export const load = async ({locals}) => {
    requireAdminPage(locals, "super_admin")
    const npsResults = await getNPSResults();
    return {
        npsResults: npsResults.ok ? await npsResults.json() : null,
    };
}