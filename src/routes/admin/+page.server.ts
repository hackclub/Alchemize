import type { PageServerLoad } from './$types';
import { redirect } from "@sveltejs/kit"

export const load: PageServerLoad = async ({ parent }) => {
    const { admin } = await parent();

    if (!admin) {
        throw redirect(303, "/admin/login");
    }

    return admin;
};