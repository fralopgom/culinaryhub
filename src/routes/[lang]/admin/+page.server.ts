import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import db from '$lib/server/db';
import { isAdmin } from '$lib/server/admin';

export const load: PageServerLoad = async ({ locals }) => {
	if (!isAdmin(locals.user)) error(403);

	const [recipesToday, activeFlags, flaggedRecipes, newUsers] = await Promise.all([
		db`SELECT COUNT(*)::int AS count FROM recipes WHERE created_at > now() - interval '1 day'`,
		db`SELECT COUNT(*)::int AS count FROM flags WHERE status = 'pending'`,
		db`SELECT COUNT(*)::int AS count FROM recipes WHERE status = 'flagged'`,
		db`SELECT COUNT(*)::int AS count FROM users WHERE created_at > now() - interval '7 days'`
	]);

	return {
		metrics: {
			recipes_today:   recipesToday[0].count,
			active_flags:    activeFlags[0].count,
			flagged_recipes: flaggedRecipes[0].count,
			new_users:       newUsers[0].count
		}
	};
};
