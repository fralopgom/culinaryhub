import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import db from '$lib/server/db';
import { isAdmin } from '$lib/server/admin';

export const load: PageServerLoad = async ({ locals }) => {
	if (!isAdmin(locals.user?.address)) error(403);

	const flagged = await db`
		SELECT
			r.id AS recipe_id, r.slug, r.title, r.status,
			u.ethereum_address AS author_address, u.username AS author_username,
			SUM(f.prestige_weight)::int AS total_weight,
			COUNT(f.id)::int AS flag_count,
			json_agg(json_build_object('reason', f.reason, 'detail', f.detail) ORDER BY f.created_at) AS flags
		FROM flags f
		JOIN recipes r ON f.recipe_id = r.id
		JOIN users u ON r.author_id = u.id
		WHERE f.status = 'pending'
		GROUP BY r.id, r.slug, r.title, r.status, u.ethereum_address, u.username
		ORDER BY total_weight DESC
	`;

	return { flagged };
};

async function logAction(adminId: string, action: string, targetId: string, reason: string) {
	await db`
		INSERT INTO admin_actions (admin_id, action, target_id, reason)
		VALUES (${adminId}, ${action}, ${targetId}, ${reason})
	`;
}

async function getAdminId(address: string) {
	const [u] = await db`SELECT id FROM users WHERE ethereum_address = ${address}`;
	return u?.id ?? null;
}

export const actions: Actions = {
	confirm_flags: async ({ request, locals }) => {
		if (!isAdmin(locals.user?.address)) error(403);
		const data      = await request.formData();
		const recipe_id = data.get('recipe_id') as string;
		const reason    = (data.get('reason') as string)?.trim();
		if (!reason) return fail(400, { error: 'reason_required' });

		const adminId = await getAdminId(locals.user!.address);
		await db.begin(async (db) => {
			await db`UPDATE flags SET status = 'confirmed' WHERE recipe_id = ${recipe_id} AND status = 'pending'`;
			await db`UPDATE recipes SET status = 'hidden' WHERE id = ${recipe_id}`;
			const [r] = await db`SELECT author_id FROM recipes WHERE id = ${recipe_id}`;
			await db`INSERT INTO notifications (user_id, type, reference_id) VALUES (${r.author_id}, 'recipe_hidden_admin', ${recipe_id})`;
		});
		await logAction(adminId, 'hide_recipe', recipe_id, reason);
		return { success: true };
	},

	dismiss_flags: async ({ request, locals }) => {
		if (!isAdmin(locals.user?.address)) error(403);
		const data      = await request.formData();
		const recipe_id = data.get('recipe_id') as string;
		const reason    = (data.get('reason') as string)?.trim();
		if (!reason) return fail(400, { error: 'reason_required' });

		const adminId = await getAdminId(locals.user!.address);
		await db`UPDATE flags SET status = 'dismissed' WHERE recipe_id = ${recipe_id} AND status = 'pending'`;
		await db`UPDATE recipes SET status = 'published' WHERE id = ${recipe_id} AND status = 'flagged'`;
		await logAction(adminId, 'dismiss_flags', recipe_id, reason);
		return { success: true };
	},

	ban_wallet: async ({ request, locals }) => {
		if (!isAdmin(locals.user?.address)) error(403);
		const data    = await request.formData();
		const address = data.get('address') as string;
		const reason  = (data.get('reason') as string)?.trim();
		if (!reason) return fail(400, { error: 'reason_required' });

		const adminId = await getAdminId(locals.user!.address);
		const [u] = await db`SELECT id FROM users WHERE ethereum_address = ${address}`;
		if (!u) return fail(404, { error: 'user_not_found' });

		await db.begin(async (db) => {
			await db`UPDATE users SET is_banned = true WHERE id = ${u.id}`;
			await db`UPDATE recipes SET status = 'hidden' WHERE author_id = ${u.id} AND status = 'published'`;
		});
		await logAction(adminId, 'ban_wallet', u.id, reason);
		return { success: true };
	}
};
