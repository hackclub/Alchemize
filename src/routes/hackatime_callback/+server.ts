import { env } from '$env/dynamic/private';
import {PUBLIC_HACKATIME_AUTH, PUBLIC_HACKATIME_REDIRECT} from '$env/static/public'
import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { patchUserHackatime } from '$lib/db';


export const GET: RequestHandler = async ({ url, cookies, fetch, locals }) => {
	const code = url.searchParams.get('code');
	if (!code) {
		throw error(400, 'Missing authorization code');
	}
	// Verified once per request in hooks.server.ts
	const userData = locals.user;
	if (!userData) {
		throw redirect(303, '/');
	}

	const clientId = PUBLIC_HACKATIME_AUTH;
	const clientSecret = env.HACKATIME_SECRET;
	const redirectUri = PUBLIC_HACKATIME_REDIRECT;

	if (!clientId || !clientSecret || !redirectUri) {
		throw error(500, 'Missing Hackatime OAuth environment variables');
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




	const email = userData.email





	const patchResponse = await patchUserHackatime(email, tokenBody.access_token);

	const patchBody = await patchResponse.json().catch(() => null);
	if (!patchResponse.ok) {
		throw error(patchResponse.status, patchBody?.error?.message ?? 'Failed to update Postgress user');
	}


	cookies.set('hackatime_verified', 'true', {
		httpOnly: false,
		secure: true,
		sameSite: 'lax',
		path: '/',
		maxAge: 60 * 60 * 24 * 30
	});

	throw redirect(303, '/dashboard');
};
