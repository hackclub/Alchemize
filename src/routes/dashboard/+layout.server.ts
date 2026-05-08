
import type { LayoutServerLoad } from './$types';
import { jwtDecode } from 'jwt-decode';

export const load: LayoutServerLoad = async ({cookies}) => {
	const allowedEmails = [
        "utkarshchandel2012@gmail.com",
        "aoishikkhan@gmail.com",
        "prajwal.uppalapati@gmail.com",
        "mahasankarshant@gmail.com"
    ]
    const idToken = cookies.get("id_token")
    if (!idToken) {
        return {
            allowed: false
        }
    }
    const decodedToken: { email?: string } = jwtDecode(idToken)
    const email = decodedToken.email
    if (!email || !allowedEmails.includes(email)) {
        return {
            allowed: false
        }
    }
    return {
        allowed: true
    }
}