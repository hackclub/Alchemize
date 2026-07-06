import type { AdminJWT } from "$lib/types";
import { ADMIN_JWT_SECRET } from "$env/static/private";
import jwt from "jsonwebtoken";
//WIP :P
export const POST = async ({ request, cookies }) => {
    const adminToken = cookies.get('admin_jwt');
    const { orderId } = await request.json();
    if (!adminToken) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    try {
        const decoded = jwt.verify(adminToken, ADMIN_JWT_SECRET) as AdminJWT;
        if (!decoded) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
}