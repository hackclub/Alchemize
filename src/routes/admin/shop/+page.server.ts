import type { PageServerLoad } from './$types';
import type { Item, UserCurrency } from "$lib/types"
import { getUserByEmail, fetchAllItems, upsertShopItem } from '$lib/db';
import { redirect, error } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { ADMIN_JWT_SECRET, CDN_UPLOAD_SECRET } from '$env/static/private';
export const actions = {
    upsert: async (event) => {
        const userToken = event.cookies.get('admin_jwt');

        let data: { email: string; isShopManager: boolean } | null = null;
        if (userToken) {
            try {
                data = jwt.verify(userToken, ADMIN_JWT_SECRET) as { email: string; isShopManager: boolean };
            }
            catch (err) {
                console.error("Error verifying JWT:", err);
                return error(401, "Unauthorized");
            }
        } else {
            return error(401, "Unauthorized");
        }
        if (!data || !data.email || data.isShopManager !== true) {
            console.log(data)
            return error(403, "Forbidden");
        }
        //Fetch all the form data
        const formData = await event.request.formData();
        const itemID = formData.get('itemID') as string | null;
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const itemPrice = parseInt(formData.get('itemPrice') as string);
        const cdnImage = formData.get('cdnImage') as string;
        const currencyType = formData.get('currencyType') as string;
        const img = formData.get('img') as File | null;
        if (!name || !description || !itemPrice || !currencyType || !itemID ) {
            return error(400, "Bad Request");
        }
        let cdnLink = cdnImage;
        if (img) {
            const tempFormData = new FormData();
            tempFormData.append('file', img);

            const cdnResponse = await fetch('https://cdn.hackclub.com/api/v4/upload', {
                method: 'POST',
                headers: { 'Authorization': "Bearer " + CDN_UPLOAD_SECRET },
                body: tempFormData
            });
            if (!cdnResponse.ok) {
                const errorData = await cdnResponse.json();
                const errorCode = errorData.error?.type || 'UNKNOWN_ERROR';
                const errorText = errorData.error?.message || 'An error occurred while uploading the image';
                console.error('CDN upload failed:', {
                    status: cdnResponse.status,
                    errorCode,
                    errorText,
                    timestamp: new Date().toISOString()
                });
                throw new Error(`Image upload failed: ${errorText}. Please notify TheUtkarsh8939 on slack with the error code: ${errorCode}`);
            }
            const { url } = await cdnResponse.json();
            cdnLink = url;
        }
        let itemPriceObj = {
            redstone: 0,
            glowstone: 0,
            aqua_regia: 0,
            potion_mix: 0,
        }
        itemPriceObj[currencyType as keyof UserCurrency] = itemPrice;
        const upsertResponse = await upsertShopItem({
            name,
            description,
            itemPrice: itemPriceObj,
            cdnImage: cdnLink,

        }, itemID )
        if(upsertResponse.ok) {
            return {
                success: true,
                message: "Item upserted successfully"
            }
        }else {
            const errorText = await upsertResponse.text();
            console.error("Error upserting item:", errorText);
            return error(500, "Internal Server Error: " + errorText);
        }
    }
}

export const load: PageServerLoad = async ({ cookies }) => {

    const at = cookies.get('access_token_new');
    const userToken = cookies.get('admin_jwt');

    let data: { email: string; isShopManager: boolean } | null = null;
    if (userToken) {
        try {
            data = jwt.verify(userToken, ADMIN_JWT_SECRET) as { email: string; isShopManager: boolean };
        }
        catch (err) {
            console.error("Error verifying JWT:", err);
            return redirect(302, '/admin/login');
        }
    } else {
        return redirect(302, '/admin/login');
    }
    if (!data || !data.email || data.isShopManager !== true) {
        console.log(data)
        return redirect(302, '/admin/login');
    }
    const email = data?.email;
    const itemsResponse = await fetchAllItems();
    if (!itemsResponse.ok) {
        throw new Error("Failed to fetch items from the database");
    }
    const itemsData = await itemsResponse.json();
    const items: Item[] = itemsData.records.map((record: any) => ({
        itemID: record.id,
        name: record.fields.name,
        description: record.fields.description,
        itemPrice: record.fields.itemPrice,
        cdnImage: record.fields.cdnImage,
    }));

    return {
        items,

    }
}