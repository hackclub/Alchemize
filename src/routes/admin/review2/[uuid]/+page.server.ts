import { error } from "@sveltejs/kit";
// Restricted until the page has proper authentication (TODO: access for Seb's team). Nothing is read from the
// database before that: a lookup first would reveal whether a Unified ID exists (404 vs 403) to anyone.
export const load = async () => {
    throw error(403, "Access to this page is currently restricted")
}
