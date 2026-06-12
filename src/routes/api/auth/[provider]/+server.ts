import { redirect, error } from '@sveltejs/kit';
import { randomBytes } from 'crypto';
import { googleAuthUrl, githubAuthUrl } from '$lib/server/auth';

export const GET = async ({ params, url, cookies }) => {
	const { provider } = params;
	if (provider !== 'google' && provider !== 'github') error(404);

	const lang  = url.searchParams.get('lang') ?? 'es';
	const nonce = randomBytes(16).toString('hex');
	const state = `${lang}.${nonce}`;

	cookies.set('oauth_state', state, {
		httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 600
	});

	const redirectUri = `${url.origin}/api/auth/${provider}/callback`;
	const authUrl = provider === 'google'
		? googleAuthUrl(redirectUri, state)
		: githubAuthUrl(redirectUri, state);

	redirect(302, authUrl);
};
