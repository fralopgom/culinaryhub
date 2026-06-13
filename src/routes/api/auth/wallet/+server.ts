import { json, error } from '@sveltejs/kit';
import { verifyMessage } from 'ethers';
import { createSession } from '$lib/server/auth';
import db from '$lib/server/db';
import type { RequestHandler } from './$types';

const MAX_AGE_MS = 5 * 60 * 1000; // 5 min — prevents replay attacks

export const POST: RequestHandler = async ({ request, cookies }) => {
	const { address, message, signature } = await request.json().catch(() => ({}));

	if (!address || !message || !signature) error(400, 'missing_fields');

	// Verify timestamp embedded in message is recent
	const tsMatch = message.match(/Timestamp: (\d+)/);
	if (!tsMatch || Date.now() - parseInt(tsMatch[1]) > MAX_AGE_MS) error(400, 'message_expired');

	// Verify signature
	let recovered: string;
	try {
		recovered = verifyMessage(message, signature);
	} catch {
		error(400, 'invalid_signature');
	}
	if (recovered.toLowerCase() !== address.toLowerCase()) error(401, 'signature_mismatch');

	// Find or create user for this wallet address
	const [existing] = await db`SELECT id FROM users WHERE address = ${address.toLowerCase()}`;
	let userId: string;

	if (existing) {
		userId = existing.id;
		await db`UPDATE users SET updated_at = now() WHERE id = ${userId}`;
	} else {
		const username = 'wallet-' + address.slice(2, 8).toLowerCase();
		const [u] = await db`
			INSERT INTO users (address, username)
			VALUES (${address.toLowerCase()}, ${username})
			RETURNING id
		`;
		userId = u.id;
	}

	const token = await createSession(userId);
	cookies.set('culinaryhub_session', token, {
		httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30
	});

	return json({ ok: true });
};
