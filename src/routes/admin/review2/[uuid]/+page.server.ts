import {fetchProjectFromUnifiedUUID} from "$lib/db"
import { error } from "@sveltejs/kit";
export const load = async ({ params }) => {
    const { uuid } = params
    const projectResponse = await fetchProjectFromUnifiedUUID(uuid)
    if (!projectResponse.ok) {
        if (projectResponse.status === 404) {
            throw error(404, "Project not found")
        }
        else{
            throw error(500, "Failed to fetch project")
        }
    }
    const data = await projectResponse.json()
    throw error(403, "Access to this page is currently restricted")
    return {
        // project: data.records[0]
        project:[]
        //TODO: Add a proper authentication for Seb's team
    }
}
