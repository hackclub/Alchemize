import { env } from '$env/dynamic/private';
import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { jwtDecode } from 'jwt-decode';

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
    console.log(clientId, clientSecret, redirectUri, airtableClient, airtableSecret);
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

	const tokenBody = await tokenResponse.json().catch(() => null);
	if (!tokenResponse.ok || !tokenBody?.access_token) {
		throw error(tokenResponse.status || 400, tokenBody?.message ?? 'Hackatime token exchange failed');
	}

	let userRecordId = cookies.get('airtable_user_record_id') ?? '';

	if (!userRecordId) {
		const idToken = cookies.get('id_token') ?? cookies.get('id-token');
		if (!idToken) {
			throw error(401, 'Missing user identity token');
		}

		const decoded = jwtDecode<IdTokenClaims>(idToken);
		const email = decoded.email;
		if (!email) {
			throw error(400, 'Email not found in identity token');
		}

		const filterByFormula = encodeURIComponent(`{email}="${email}"`);
		const userLookupResponse = await fetch(
			`https://api.airtable.com/v0/${airtableClient}/Users?filterByFormula=${filterByFormula}`,
			{
				headers: {
					Authorization: `Bearer ${airtableSecret}`
				}
			}
		);

		const userLookupBody = await userLookupResponse.json().catch(() => null);
		if (!userLookupResponse.ok) {
			throw error(userLookupResponse.status, userLookupBody?.message ?? 'Failed to find Airtable user');
		}

		const record = userLookupBody?.records?.[0];
		if (!record?.id) {
			throw error(404, 'Airtable user not found');
		}

		userRecordId = record.id;
		cookies.set('airtable_user_record_id', userRecordId, {
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			path: '/',
			maxAge: 60 * 60 * 24 * 30
		});
	}

	const patchResponse = await fetch(`https://api.airtable.com/v0/${airtableClient}/Users/${userRecordId}`, {
		method: 'PATCH',
		headers: {
			Authorization: `Bearer ${airtableSecret}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			fields: {
				hackatime: tokenBody.access_token
			}
		})
	});

	const patchBody = await patchResponse.json().catch(() => null);
	if (!patchResponse.ok) {
		throw error(patchResponse.status, patchBody?.error?.message ?? 'Failed to update Airtable user');
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
