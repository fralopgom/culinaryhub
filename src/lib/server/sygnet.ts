import { env } from '$env/dynamic/private';

const SYGNET_API_URL = env.SYGNET_API_URL;
const SYGNET_SUITE_KEY = env.SYGNET_SUITE_KEY;

const headers: Record<string, string> = {
	'Content-Type': 'application/json',
	'X-Suite-Key': SYGNET_SUITE_KEY ?? ''
};

export async function verifySession(token: string) {
	const res = await fetch(`${SYGNET_API_URL}/api/suite/session/verify`, {
		method: 'POST',
		headers,
		body: JSON.stringify({ session_token: token })
	});
	if (!res.ok) return null;
	const data = await res.json();
	return data.valid ? data : null;
}

export async function getPrestige(address: string) {
	const res = await fetch(`${SYGNET_API_URL}/api/suite/prestige/${address}`, { headers });
	if (!res.ok) return null;
	return res.json();
}

export async function getIdentity(address: string) {
	const res = await fetch(`${SYGNET_API_URL}/api/suite/identity/${address}`, { headers });
	if (!res.ok) return null;
	return res.json();
}
