import {getOrderDetailsById} from "$lib/db";
import {ADMIN_JWT_SECRET} from "$env/static/private";
import jwt from "jsonwebtoken";
import type { PageServerLoad } from "./$types";
import type {AdminJWT} from "$lib/types";
import { redirect } from "@sveltejs/kit";
import {decryptAES} from "$lib/utils.server";   
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

        const orderDetailsRes = await getOrderDetailsById(orderId);
        const orderDetails = await orderDetailsRes.json();
        const iv = orderDetails.fields.iv;
        const decryptedBday = decryptAES(orderDetails.fields.userBirthdate, iv);
        const decryptedFirstName = decryptAES(orderDetails.fields.userFirstName, iv);
        const decryptedLastName = decryptAES(orderDetails.fields.userLastName, iv);
        const ageNow = new Date().getFullYear() - new Date(decryptedBday).getFullYear();
        return {
           orderDetails:{
            id: orderDetails.id,
            fulfillerId: orderDetails.fields.fulfiller,
            name: orderDetails.fields.itemName,
            qty: orderDetails.fields.qty,
            status: orderDetails.fields.status,
            fulfiller: orderDetails.fields.fulfiller,
            email: orderDetails.fields.ordererEmail,
            dateCreated: orderDetails.fields.dateCreated,
            price: orderDetails.fields.itemPrice,
            img: orderDetails.fields.cdnImage,
            ageNow,
            firstName: decryptedFirstName,
            lastName: decryptedLastName,
            
           }
        };

}