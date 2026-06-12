import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/db';
import { env } from '$env/dynamic/private';

const FLAG_HIDE_THRESHOLD = parseInt(env.FLAG_HIDE_THRESHOLD ?? '5');

// POST /api/flags
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401);

	const [flagger] = await db`
		SELECT id, prestige_score, wallet_tier FROM users WHERE ethereum_address = ${locals.user.address}
	`;
	if (!flagger) error(401);
	if (flagger.wallet_tier < 1) error(403, 'wallet_tier_insufficient');

	const { recipe_id, reason, detail } = await request.json();

	if (!recipe_id) error(400, 'recipe_id_required');
	if (!reason)    error(400, 'reason_required');

	const [recipe] = await db`SELECT id, author_id, status FROM recipes WHERE id = ${recipe_id}`;
	if (!recipe) error(404);
	if (recipe.status === 'hidden') error(404);

	const [existing] = await db`SELECT id FROM flags WHERE recipe_id = ${recipe_id} AND user_id = ${flagger.id}`;
	if (existing) error(409, 'already_flagged');

	await db.begin(async (db) => {
		await db`
			INSERT INTO flags (recipe_id, user_id, reason, detail, prestige_weight)
			VALUES (${recipe_id}, ${flagger.id}, ${reason}, ${detail ?? null}, ${flagger.prestige_score})
		`;

		// Check weighted threshold — auto-flag the recipe if exceeded
		const [{ total_weight }] = await db`
			SELECT COALESCE(SUM(prestige_weight), 0)::int AS total_weight
			FROM flags
			WHERE recipe_id = ${recipe_id} AND status = 'pending'
		`;

		if (total_weight >= FLAG_HIDE_THRESHOLD) {
			await db`UPDATE recipes SET status = 'flagged' WHERE id = ${recipe_id}`;

			await db`
				INSERT INTO notifications (user_id, type, reference_id)
				VALUES (${recipe.author_id}, 'recipe_hidden_admin', ${recipe_id})
			`;
		}
	});

	return json({ ok: true }, { status: 201 });
};
