import type { RequestHandler } from "./$types"
import { deleteProject, getProjectForEdit } from "$lib/db"
import { requireUserApi } from "$lib/server/auth";

export const DELETE: RequestHandler = async ({ request, locals }) => {
    // // TEMP DISABLED
    // return new Response(JSON.stringify({ message: "Project deletion is temporarily disabled" }), { status: 503 });
    
    const email = requireUserApi(locals).email;
    const { recordId } = await request.json();
    if (!recordId) {
        return new Response(JSON.stringify({ message: "Record ID is required" }), { status: 400 });
    }
    // Only the owner's own project is looked up, so other projects' existence or state is never revealed
    const project = await getProjectForEdit(String(recordId), email);
    if (!project) {
        return new Response(JSON.stringify({ message: "Project not found" }), { status: 404 });
    }
    if (project.log !== "") {
        return new Response(JSON.stringify({ message: "Cannot delete project which has been shipped before" }), { status: 400 });
    }
    const response = await deleteProject(recordId, email);
    if (response.ok) {
        return new Response(JSON.stringify({ message: "Project deleted successfully" }), { status: 200 });
    } else {
        return new Response(JSON.stringify({ message: "Failed to delete project "+(await response.text()) }), { status: 500 });
    }
}