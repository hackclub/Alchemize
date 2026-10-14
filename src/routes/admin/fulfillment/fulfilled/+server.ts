import { markOrderAsFulfilled } from "$lib/db";
import { requireAdminApi } from "$lib/server/auth";
export const POST = async ({ request, locals }) => {
    const decoded = requireAdminApi(locals, "fulfiller");
    const { orderId } = await request.json();
    const result = await markOrderAsFulfilled(orderId, decoded.slackId);
    if (result.ok) {
        return new Response(JSON.stringify({ message: 'Order marked as fulfilled' }), { status: 200 });
    } else {
        return new Response(JSON.stringify({ error: 'Failed to mark order as fulfilled' }), { status: result.status });
    }
}