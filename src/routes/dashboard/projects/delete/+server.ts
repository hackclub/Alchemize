import type { RequestHandler } from "./$types"
import { deleteProject } from "$lib/db"
import jwt from "jsonwebtoken";
import { USER_JWT_SECRET } from "$env/static/private";
export const DELETE: RequestHandler = async ({ request, cookies }) => {
    //TEMP DISABLED
    return new Response(JSON.stringify({ message: "Project deletion is temporarily disabled" }), { status: 503 });
    /*
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
    const response = await deleteProject(recordId, email);
    if (response.ok) {
        return new Response(JSON.stringify({ message: "Project deleted successfully" }), { status: 200 });
    } else {
        return new Response(JSON.stringify({ message: "Failed to delete project "+(await response.text()) }), { status: 500 });
    }*/
}