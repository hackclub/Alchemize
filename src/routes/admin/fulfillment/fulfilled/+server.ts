import type { AdminJWT } from "$lib/types";
import { ADMIN_JWT_SECRET } from "$env/static/private";
import jwt from "jsonwebtoken";
import { markOrderAsFulfilled } from "$lib/db";
//WIP :P
export const POST = async ({ request, cookies }) => {
    const adminToken = cookies.get('admin_jwt');
    const { orderId } = await request.json();
    if (!adminToken) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    try {
        var decoded = jwt.verify(adminToken, ADMIN_JWT_SECRET) as AdminJWT;
        if (!decoded) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    const result = await markOrderAsFulfilled(orderId, decoded.slackId);
    if (result.ok) {
        return new Response(JSON.stringify({ message: 'Order marked as fulfilled' }), { status: 200 });
    } else {
        return new Response(JSON.stringify({ error: 'Failed to mark order as fulfilled' }), { status: result.status });
    }
}