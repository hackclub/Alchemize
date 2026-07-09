import { env } from '$env/dynamic/private';
import {PUBLIC_HACKATIME_AUTH, PUBLIC_HACKATIME_REDIRECT} from '$env/static/public'
import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import jwt from 'jsonwebtoken';
import {USER_JWT_SECRET} from '$env/static/private'
import { patchUserHackatime } from '$lib/db';
import type {UserAuthToken} from '$lib/types';


export const GET: RequestHandler = async ({ url, cookies, fetch }) => {
	const code = url.searchParams.get('code');
	const userToken = cookies.get('user_token');
	if (!code) {
		throw error(400, 'Missing authorization code');
	}
	if (!userToken) {
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




	const at = cookies.get('access_token_new') ?? cookies.get('access_token');
	if (!at) {
		throw error(401, 'Missing access token cookie');
	}
	let userData: UserAuthToken;
	try {
		let decoded= jwt.verify(userToken, USER_JWT_SECRET) as unknown as UserAuthToken;
		if (!decoded.email) {
			throw new Error('Email claim missing in JWT');
		}
		userData = decoded;
	}catch (err) {
		console.error('JWT verification failed:', err);
		throw error(401, 'Invalid User token');
	}
	let email = userData?.email





	const patchResponse = await patchUserHackatime(email, tokenBody.access_token);

	const patchBody = await patchResponse.json().catch(() => null);
	if (!patchResponse.ok) {
		throw error(patchResponse.status, patchBody?.error?.message ?? 'Failed to update Postgress user');
	}


	cookies.set('hackatime_verified', 'true', {
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		path: '/',
		maxAge: 60 * 60 * 24 * 30
	});

	throw redirect(303, '/dashboard');
};
