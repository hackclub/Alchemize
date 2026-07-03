import {getOrderDetailsById} from "$lib/db";
import {ADMIN_JWT_SECRET} from "$env/static/private";
import jwt from "jsonwebtoken";
import type { PageServerLoad } from "./$types";
import type {AdminJWT} from "$lib/types";
import { redirect } from "@sveltejs/kit";
export const load: PageServerLoad = async ({ params, cookies }) => {
        const adminAuthToken = cookies.get('admin_jwt');
        try{
            if (!adminAuthToken) {
                throw new Error("Unauthorized");
            }
            const decoded = jwt.verify(adminAuthToken, ADMIN_JWT_SECRET) as AdminJWT;
            if (!decoded) {
                throw new Error("Unauthorized");
            }
            if (!decoded.isFulfiller) {
                throw new Error("Unauthorized");
            }
        }catch (error) {
            return redirect(302, '/admin/login');
        }
        const orderId = params.id;

        const orderDetails = await getOrderDetailsById(orderId);

        return {
           orderDetails: await orderDetails.json()
        };

}