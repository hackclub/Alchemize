import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url, cookies }) => {
    let refer = url.searchParams.get("refer") || null
    if (refer != null) {
        cookies.set("refer", refer, { maxAge: 60 * 60 * 24 * 10, path: "/" })

    }

}