import { env } from '$env/dynamic/private';
import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { jwtDecode } from 'jwt-decode';
import { getDataFromAccessToken } from '$lib/utils';
import { getUserByEmail, patchUserHackatime } from '$lib/db';
type IdTokenClaims = {
	email?: string;
};

export const GET: RequestHandler = async ({ url, cookies, fetch }) => {
	const code = url.searchParams.get('code');
	if (!code) {
		throw error(400, 'Missing authorization code');
	}

	const clientId = env.HACKATIME_AUTH ?? env.PUBLIC_HACKATIME_AUTH;
	const clientSecret = env.HACKATIME_SECRET;
	const redirectUri = env.HACKATIME_REDIRECT ?? env.PUBLIC_HACKATIME_REDIRECT;
	const airtableClient = env.AIRTABLE_CLIENT;
	const airtableSecret = env.AIRTABLE;
	// console.log(clientId, clientSecret, redirectUri, airtableClient, airtableSecret);
	if (!clientId || !clientSecret || !redirectUri) {
		throw error(500, 'Missing Hackatime OAuth environment variables');
	}

	if (!airtableClient || !airtableSecret) {
		throw error(500, 'Missing Airtable environment variables');
	}

	const tokenResponse = await fetch('https://hackatime.hackclub.com/oauth/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			client_id: clientId,
			client_secret: clientSecret,
			redirect_uri: redirectUri,
			code,
			grant_type: 'authorization_code'
		})
	});

	const tokenBody = await tokenResponse.json()
	if (!tokenResponse.ok || !tokenBody?.access_token) {
		console.error('Hackatime token exchange failed:', tokenBody);

		throw error(tokenResponse.status || 400, tokenBody?.message ?? 'Hackatime token exchange failed');
	}




		const at = cookies.get('access_token_new') ?? cookies.get('access_token');
		if (!at) {
			throw error(401, 'Missing access token cookie');
		}
		const email = (await getDataFromAccessToken(at)).email;

		const userLookupResponse = await getUserByEmail(email);

		const userLookupBody = await userLookupResponse.json().catch(() => null);
		if (!userLookupResponse.ok) {
			throw error(userLookupResponse.status, userLookupBody?.message ?? 'Failed to find Airtable user');
		}

		const record = userLookupBody?.records?.[0];
		if (!record?.id) {
			throw error(404, 'Airtable user not found');
		}


	

	const patchResponse = await patchUserHackatime(email, tokenBody.access_token);

	const patchBody = await patchResponse.json().catch(() => null);
	if (!patchResponse.ok) {
		throw error(patchResponse.status, patchBody?.error?.message ?? 'Failed to update Postgress user');
	}

	cookies.set('hackatime_token', tokenBody.access_token, {
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		path: '/',
		maxAge: 60 * 60 * 24 * 30
	});

	cookies.set('hackatime_verified', 'true', {
		httpOnly: false,
		secure: true,
		sameSite: 'lax',
		path: '/',
		maxAge: 60 * 60 * 24 * 30
	});

	throw redirect(303, '/dashboard');
};
