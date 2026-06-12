import { redirect, error } from '@sveltejs/kit';
import { exchangeGoogleCode, exchangeGithubCode, createSession } from '$lib/server/auth';
import { slugify } from '$lib/utils/slug';
import db from '$lib/server/db';

export const GET = async ({ params, url, cookies }) => {
	const { provider } = params;
	if (provider !== 'google' && provider !== 'github') error(404);

	// CSRF check
	const state       = url.searchParams.get('state');
	const storedState = cookies.get('oauth_state');
	if (!state || state !== storedState) error(400, 'invalid_state');
	cookies.delete('oauth_state', { path: '/' });

	const lang = state.split('.')[0] ?? 'es';
	const code = url.searchParams.get('code');
	if (!code) error(400, 'missing_code');

	let oauthUser: { id: string; email: string; name: string };
	try {
		const redirectUri = `${url.origin}/api/auth/${provider}/callback`;
		oauthUser = provider === 'google'
			? await exchangeGoogleCode(code, redirectUri)
			: await exchangeGithubCode(code, redirectUri);
	} catch {
		error(502, 'oauth_failed');
	}

	// Find or create user
	let userId: string;
	const [byProvider] = await db`
		SELECT id FROM users WHERE oauth_provider = ${provider} AND oauth_id = ${oauthUser.id}
	`;

	if (byProvider) {
		userId = byProvider.id;
	} else {
		// Merge if same email exists (different provider)
		const [byEmail] = await db`SELECT id FROM users WHERE email = ${oauthUser.email}`;
		if (byEmail) {
			await db`UPDATE users SET oauth_provider = ${provider}, oauth_id = ${oauthUser.id}
			         WHERE id = ${byEmail.id}`;
			userId = byEmail.id;
		} else {
			const username = slugify(oauthUser.name).slice(0, 20) + '-' + Date.now().toString(36).slice(-4);
			const [u] = await db`
				INSERT INTO users (oauth_provider, oauth_id, email, username)
				VALUES (${provider}, ${oauthUser.id}, ${oauthUser.email}, ${username})
				RETURNING id
			`;
			userId = u.id;
		}
	}

	const token = await createSession(userId);
	cookies.set('culinaryhub_session', token, {
		httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30
	});

	redirect(302, `/${lang}`);
};
