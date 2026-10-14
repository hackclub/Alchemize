import {getOrderDetailsById} from "$lib/db";
import type { PageServerLoad } from "./$types";
import {decryptAES} from "$lib/utils.server";
import { requireAdminPage } from "$lib/server/auth";
export const load: PageServerLoad = async ({ params, locals }) => {
        requireAdminPage(locals, "fulfiller");
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
            priceHundredths: orderDetails.fields.priceHundredths,
            img: orderDetails.fields.cdnImage,
            ageNow,
            firstName: decryptedFirstName,
            lastName: decryptedLastName,
            
           }
        };

}