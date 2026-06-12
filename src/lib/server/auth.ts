import { env } from '$env/dynamic/private';
import { randomBytes } from 'crypto';
import db from './db';

// Captured with ! — required at runtime, absent only if misconfigured
const GOOGLE_ID     = () => env.GOOGLE_CLIENT_ID!;
const GOOGLE_SECRET = () => env.GOOGLE_CLIENT_SECRET!;
const GITHUB_ID     = () => env.GITHUB_CLIENT_ID!;
const GITHUB_SECRET = () => env.GITHUB_CLIENT_SECRET!;

export async function createSession(userId: string): Promise<string> {
	const id = randomBytes(32).toString('hex');
	await db`INSERT INTO sessions (id, user_id) VALUES (${id}, ${userId})`;
	return id;
}

export async function getSession(token: string) {
	const [row] = await db`
		SELECT s.user_id, u.address, u.username, u.prestige_score,
		       u.is_admin, u.is_banned, u.oauth_provider, u.created_at
		FROM sessions s
		JOIN users u ON u.id = s.user_id
		WHERE s.id = ${token} AND s.expires_at > now()
	`;
	return row ?? null;
}

export async function deleteSession(token: string) {
	await db`DELETE FROM sessions WHERE id = ${token}`;
}

export function computeAccountTier(createdAt: Date): number {
	const days = (Date.now() - new Date(createdAt).getTime()) / 86_400_000;
	if (days < 7)  return 0;
	if (days < 30) return 1;
	return 2;
}

export function googleAuthUrl(redirectUri: string, state: string): string {
	return 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
		client_id: GOOGLE_ID(),
		redirect_uri: redirectUri,
		response_type: 'code',
		scope: 'openid email profile',
		state,
		prompt: 'select_account'
	});
}

export function githubAuthUrl(redirectUri: string, state: string): string {
	return 'https://github.com/login/oauth/authorize?' + new URLSearchParams({
		client_id: GITHUB_ID(),
		redirect_uri: redirectUri,
		scope: 'read:user user:email',
		state
	});
}

export async function exchangeGoogleCode(code: string, redirectUri: string) {
	const tokens = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({ code, redirect_uri: redirectUri,
			grant_type: 'authorization_code',
			client_id: GOOGLE_ID(), client_secret: GOOGLE_SECRET() })
	}).then(r => r.json());
	if (!tokens.access_token) throw new Error('google_token_failed');

	const u = await fetch('https://www.googleapis.com/oauth2/v2/userinfo',
		{ headers: { Authorization: `Bearer ${tokens.access_token}` } }).then(r => r.json());
	return { id: u.id as string, email: u.email as string, name: (u.name ?? u.email) as string };
}

export async function exchangeGithubCode(code: string, redirectUri: string) {
	const tokens = await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({ code, redirect_uri: redirectUri,
			client_id: GITHUB_ID(), client_secret: GITHUB_SECRET() })
	}).then(r => r.json());
	if (!tokens.access_token) throw new Error('github_token_failed');

	const h = { Authorization: `Bearer ${tokens.access_token}`, 'User-Agent': 'culinaryhub' };
	const [u, emails] = await Promise.all([
		fetch('https://api.github.com/user', { headers: h }).then(r => r.json()),
		fetch('https://api.github.com/user/emails', { headers: h }).then(r => r.json())
	]);
	const email = (emails as { primary: boolean; verified: boolean; email: string }[])
		.find(e => e.primary && e.verified)?.email ?? emails[0]?.email;
	return { id: String(u.id), email: email as string, name: (u.name ?? u.login) as string };
}
