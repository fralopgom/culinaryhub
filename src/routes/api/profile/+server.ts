import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/db';

export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401);

	const { display_name } = await request.json().catch(() => ({}));
	if (typeof display_name !== 'string') error(400, 'display_name_required');

	const clean = display_name.trim().slice(0, 50);
	if (clean.length < 2) error(400, 'display_name_too_short');

	// Unique check (ignore own row)
	if (clean) {
		const [conflict] = await db`
			SELECT id FROM users WHERE display_name = ${clean} AND id != ${locals.user.id}
		`;
		if (conflict) error(409, 'display_name_taken');
	}

	await db`UPDATE users SET display_name = ${clean || null} WHERE id = ${locals.user.id}`;

	return json({ ok: true });
};
