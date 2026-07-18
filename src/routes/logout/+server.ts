import { redirect } from "@sveltejs/kit";

export const POST = async ({ cookies }) => {
    cookies.delete("user_token", { path: "/" });
    cookies.delete("airtable_user_record_id", { path: "/" });
    cookies.delete("access_token_new", { path: "/" });
    cookies.delete("slack_id", { path: "/" });
    cookies.delete("hackatime_verified", { path: "/" });
    cookies.delete("refer", { path: "/" });
    cookies.delete("admin_access_token", { path: "/" });
    cookies.delete("admin_access_token", { path: "/" });
    cookies.delete("hackatime_token", { path: "/" });
    cookies.delete("__cf_bm", { path: "/" });

    throw redirect(303, "/");
};