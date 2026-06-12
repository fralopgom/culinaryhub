import type { PageServerLoad } from './$types';
import db from '$lib/server/db';

// Public — no auth required. Transparency by design.
export const load: PageServerLoad = async ({ url }) => {
	const page   = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
	const limit  = 50;
	const offset = (page - 1) * limit;

	const actions = await db`
		SELECT a.action, a.reason, a.target_id, a.created_at,
		       u.username AS admin_username, u.ethereum_address AS admin_address
		FROM admin_actions a
		JOIN users u ON a.admin_id = u.id
		ORDER BY a.created_at DESC
		LIMIT ${limit} OFFSET ${offset}
	`;

	return { actions, page };
};
