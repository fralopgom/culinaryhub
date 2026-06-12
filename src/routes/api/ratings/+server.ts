import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/db';

// POST /api/ratings
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401);

	const [author] = await db`
		SELECT id, prestige_score, wallet_tier FROM users WHERE ethereum_address = ${locals.user.address}
	`;
	if (!author) error(401);
	if (author.wallet_tier < 1) error(403, 'wallet_tier_insufficient');

	const { recipe_id, score, note } = await request.json();

	if (!recipe_id)                            error(400, 'recipe_id_required');
	if (!score || score < 1 || score > 5)      error(400, 'score_invalid');

	const [recipe] = await db`SELECT id, author_id FROM recipes WHERE id = ${recipe_id} AND status = 'published'`;
	if (!recipe) error(404);
	if (recipe.author_id === author.id) error(403, 'cannot_rate_own_recipe');

	const [existing] = await db`SELECT id FROM ratings WHERE recipe_id = ${recipe_id} AND user_id = ${author.id}`;
	if (existing) error(409, 'already_rated');

	await db.begin(async (db) => {
		await db`
			INSERT INTO ratings (recipe_id, user_id, score, note, prestige_weight)
			VALUES (${recipe_id}, ${author.id}, ${score}, ${note ?? null}, ${author.prestige_score})
		`;

		if (score >= 4) {
			await db`
				INSERT INTO prestige_events (user_id, source, points, reference_id)
				VALUES (${recipe.author_id}, 'recipe_rated_positive', 2, ${recipe_id})
			`;

			await db`
				INSERT INTO notifications (user_id, type, reference_id)
				VALUES (${recipe.author_id}, 'endorsement_received', ${recipe_id})
			`;
		}
	});

	return json({ ok: true }, { status: 201 });
};
