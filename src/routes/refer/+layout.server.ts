
import type { LayoutServerLoad } from './$types';
import {PUBLIC_TURNED_OFF} from '$env/static/public'
import { redirect } from '@sveltejs/kit';
export const load: LayoutServerLoad = async ({ cookies }) => {
    //Check if any user cookies is not present/ invalid, if so make the user relogin
    const accessToken = cookies.get('access_token_new');
    if (PUBLIC_TURNED_OFF !== "false") {
        throw redirect(302, "/turned-off")
    }

    
  

    if (!accessToken  || accessToken === "" ) {
        return{
            relogin:true,
        }
    }



    return {
        relogin: false,
    }
}