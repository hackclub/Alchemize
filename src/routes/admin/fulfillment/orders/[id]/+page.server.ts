import { error } from "@sveltejs/kit";
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
        let decryptedBday: string;
        let decryptedFirstName: string;
        try {
                decryptedBday = decryptAES(orderDetails.fields.userBirthdate, iv);
                decryptedFirstName = decryptAES(orderDetails.fields.userFirstName, iv);
        } catch (err) {
                // The orderer's user_internal_data row was encrypted under a different PII_ENCRYPTION_KEY than this
                // build's (see the boot-time key check in hooks.server.ts); logging in again re-encrypts it under the current key
                console.error(`Order ${orderId}: the orderer's details in user_internal_data can't be decrypted with this build's PII_ENCRYPTION_KEY`, err);
                throw error(500, "This orderer's stored name and birthday can't be decrypted with the current encryption key. Ask them to log in to Alchemize again, then reload this page. If this happens for every order, the deployment's encryption key changed: report it.");
        }
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
           }
        };

}