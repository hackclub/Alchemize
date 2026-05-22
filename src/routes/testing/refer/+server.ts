import type { RequestHandler } from '@sveltejs/kit'
import { USERID_ENCRYPTION_KEY } from '$env/static/private';


const XORencrypt = (textInp: string) => {
    const tb = Buffer.from(textInp, 'utf-8');
    const kb = Buffer.from(USERID_ENCRYPTION_KEY, "hex");
    const out = Buffer.alloc(tb.length)

    for (let i = 0; i < tb.length; i++) {
        out[i] = tb[i] ^ kb[i % kb.length]
    }
    return out.toString('base64');


}
const XORdecrypt = (textInp: string) => {
    const tb = Buffer.from(textInp, 'base64');
        const kb = Buffer.from(USERID_ENCRYPTION_KEY, "hex");
    const out = Buffer.alloc(tb.length)

    for (let i = 0; i < tb.length; i++) {
        out[i] = tb[i] ^ kb[i % kb.length]
    }
    return out.toString('utf-8');
}

export const GET: RequestHandler = async ({ url, cookies }) => {
    const at = cookies.get('access_token_new');
    const request = await fetch("https://auth.hackclub.com/api/v1/me", {
        headers: {
            Authorization: `Bearer ${at}`,
        }
    })
    const data = await request.json()
    const id = encodeURIComponent(XORencrypt(`${data.identity.id} ${data.identity.first_name}`));
    return new Response(JSON.stringify({ id: id, decrypt: XORdecrypt(decodeURIComponent(id)) }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
    });
}