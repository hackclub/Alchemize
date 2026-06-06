import { USER_JWT_SECRET } from "$env/static/private";
import { getUserByEmail } from "$lib/db"
import type { UserCurrency } from "$lib/types";
import type { PageServerLoad } from "./$types";
import looseJson from "loose-json"
import jwt from "jsonwebtoken";

export const load: PageServerLoad = async ({ cookies }) => {
    const at = cookies.get('access_token_new');
    const user_token = cookies.get('user_token');
    if (!at || !user_token) {
        return {
            error: 'No access token found'
        }
    }
    let decoded = null;
    try{
        if(user_token){
            decoded = jwt.verify(user_token, USER_JWT_SECRET);
        }
    } catch (error) {
        console.error('Invalid user token:', error);
        return {
            error: 'Invalid user token'
        }
    }

    const data = decoded ? (decoded as any) : null;
 
    let userResponse = await getUserByEmail(data.email);
    let userData = await userResponse.json();
    let user = userData.records[0].fields
    let userCurrencies = 
		looseJson(user.currency ?? "{}") as UserCurrency
    return {
        currencies: userCurrencies,
    }
}