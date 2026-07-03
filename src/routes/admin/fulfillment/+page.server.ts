import { ADMIN_JWT_SECRET } from '$env/static/private'
import type {AdminJWT} from '$lib/types'
import {redirect } from '@sveltejs/kit'
import jwt from 'jsonwebtoken'
import { getAllOrders } from '$lib/db'

export const load = async ({ cookies }) => {
    const adminToken = cookies.get("admin_jwt")
    try{
        if (!adminToken) {
            throw new Error("No admin token found")
        }
        var decoded: AdminJWT = jwt.verify(adminToken, ADMIN_JWT_SECRET) as AdminJWT
        if (!decoded || !decoded.isFulfiller) {
            throw new Error("Invalid admin token/ Unauthorized access")
        }
    } catch (error) {
        throw redirect(302, "/admin/login")
    }
    const ordersResponse = await getAllOrders()
    if (!ordersResponse.ok) {
        console.error("Database error:", await ordersResponse.text())
        throw new Error("Database error")
    }
    const ordersData = (await ordersResponse.json()).records
    return {
        orders: ordersData,
        admin: decoded
    }
}