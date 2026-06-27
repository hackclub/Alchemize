import type { RequestHandler } from "./$types"
import { deleteProject, getProjectById } from "$lib/db"
import jwt from "jsonwebtoken";
import { USER_JWT_SECRET } from "$env/static/private";
import { error } from "@sveltejs/kit";

export const DELETE: RequestHandler = async ({ request, cookies }) => {
    // // TEMP DISABLED
    // return new Response(JSON.stringify({ message: "Project deletion is temporarily disabled" }), { status: 503 });
    
    const { recordId} = await request.json();
    if (!recordId ) {
        return new Response(JSON.stringify({ message: "Record ID and email are required" }), { status: 400 });
    }
    const authCookies = cookies.get("user_token");
    let email = "";
    try{
        if (!authCookies) {
            return new Response(JSON.stringify({ message: "Unauthorized: No authentication token provided" }), { status: 401 });
        }
        const decodedToken = jwt.verify(authCookies, USER_JWT_SECRET) as { email: string };
        email = decodedToken.email;
    }catch (error) {
        console.error("Error verifying JWT token:", error);
        return new Response(JSON.stringify({ message: "Unauthorized: Invalid authentication token" }), { status: 401 });
    }
    const projectResponse = await getProjectById(recordId);
    if (!projectResponse.ok) {
        return new Response(JSON.stringify({ message: "Failed to fetch project" }), { status: 500 });
    }
    if (projectResponse.status === 404) {
        return new Response(JSON.stringify({ message: "Project not found" }), { status: 404 });
    }
    const projectData = await projectResponse.json();
    if (projectData.fields.log !== ""){
        return new Response(JSON.stringify({ message: "Cannot delete project which has been shipped before" }), { status: 400 });
    }
    const response = await deleteProject(recordId, email);
    if (response.ok) {
        return new Response(JSON.stringify({ message: "Project deleted successfully" }), { status: 200 });
    } else {
        return new Response(JSON.stringify({ message: "Failed to delete project "+(await response.text()) }), { status: 500 });
    }
}