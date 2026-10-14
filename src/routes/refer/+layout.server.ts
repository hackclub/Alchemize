
import type { LayoutServerLoad } from './$types';
import {PUBLIC_TURNED_OFF} from '$env/static/public'
import { redirect } from '@sveltejs/kit';
export const load: LayoutServerLoad = async ({ locals }) => {
    //Check if any user cookies is not present/ invalid, if so make the user relogin
    if (PUBLIC_TURNED_OFF !== "false") {
        throw redirect(302, "/turned-off")
    }

    
  

    if (!locals.user) {
        return{
            relogin:true,
        }
    }



    return {
        relogin: false,
    }
}