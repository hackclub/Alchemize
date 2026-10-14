import { getAllOrders } from '$lib/db'
import { requireAdminPage } from '$lib/server/auth'

export const load = async ({ locals }) => {
    requireAdminPage(locals, "fulfiller")
    const ordersResponse = await getAllOrders()
    if (!ordersResponse.ok) {
        console.error("Database error:", await ordersResponse.text())
        throw new Error("Database error")
    }
    const ordersData = (await ordersResponse.json()).records
    return {
        orders: ordersData
    }
}