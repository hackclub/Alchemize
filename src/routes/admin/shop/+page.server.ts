import type { PageServerLoad } from './$types';
import type { Item } from "$lib/types"
import { unitsToHundredths } from "$lib/currency"
import { deleteShopItem, fetchAllItems, upsertShopItem } from '$lib/db';
import { error } from '@sveltejs/kit';
import { CDN_UPLOAD_SECRET } from '$env/static/private';
import { requireAdminApi, requireAdminPage } from '$lib/server/auth';
export const actions = {
    upsert: async (event) => {
        requireAdminApi(event.locals, "shop_manager");
        //Fetch all the form data
        const formData = await event.request.formData();
        let itemID = formData.get('itemID') as string | null;
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        // Price is entered in Aqua Regia (up to two decimals) and stored in hundredths
        const priceHundredths = unitsToHundredths(Number(formData.get('itemPrice')));
        const cdnImage = formData.get('cdnImage') as string;
        const img = formData.get('img') as File | null;
        if (!name || !description) {
            return error(400, "Bad Request");
        }
        if (priceHundredths === null || priceHundredths <= 0) {
            return error(400, "Price must be a positive amount of Aqua Regia");
        }
        if (!itemID) {
            itemID = null;
        }
        let cdnLink = cdnImage;
        console.log("Received form data:", {
            name,
            description
        })
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
        const upsertResponse = await upsertShopItem({
            name,
            description,
            priceHundredths,
            cdnImage: cdnLink,

        }, itemID)
        if (upsertResponse.ok) {
            return {
                success: true,
                message: "Item upserted successfully"
            }
        } else {
            const errorText = await upsertResponse.text();
            console.error("Error upserting item:", errorText);
            return error(500, "Internal Server Error: " + errorText);
        }
    },
    delete: async (event) => {
        requireAdminApi(event.locals, "shop_manager");
        //Fetch all the form data
        const formData = await event.request.formData();
        let itemID = formData.get('itemID') as string | null;
        if (!itemID) {
            return error(400, "Bad Request: Missing itemID");
        }

        const deleteResponse = await deleteShopItem(itemID);
        if (!deleteResponse.ok) {
            const errorText = await deleteResponse.text();
            console.error("Error deleting item:", errorText);
            return error(404, "Item not found: " + errorText);
        }
        return {
            success: true,
            message: "Item deleted successfully"
        }
    }
}

export const load: PageServerLoad = async ({ locals }) => {
    requireAdminPage(locals, "shop_manager");
    const itemsResponse = await fetchAllItems();
    if (!itemsResponse.ok) {
        throw new Error("Failed to fetch items from the database");
    }
    const itemsData = await itemsResponse.json();
    const items: Item[] = itemsData.records.map((record: any) => ({
        itemID: record.id,
        name: record.fields.name,
        description: record.fields.description,
        priceHundredths: record.fields.priceHundredths,
        cdnImage: record.fields.cdnImage,
    }));

    return {
        items,

    }
}