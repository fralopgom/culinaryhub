import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import db from '$lib/server/db';

export const load: PageServerLoad = async ({ params }) => {
	const nameCol = params.lang === 'en' ? 'name_en' : 'name_es';

	// handle is either an Ethereum address or a username (for OAuth users)
	const [user] = await db`
		SELECT id, username, display_name, address, prestige_score, wallet_tier, created_at
		FROM users
		WHERE address = ${params.address} OR username = ${params.address}
		LIMIT 1
	`;
	if (!user) error(404);

	const recipes = await db`
		SELECT r.id, r.slug, r.title, r.description, r.difficulty, r.ai_level,
		       r.prep_time_min, r.cook_time_min,
		       u.username AS author_username, u.display_name AS author_display_name,
		       u.prestige_score AS author_prestige,
		       c.${db(nameCol)} AS culture_name, c.slug AS culture_slug,
		       COALESCE(AVG(rt.score), 0)::numeric(3,1) AS avg_score,
		       COUNT(DISTINCT rt.id)::int AS rating_count
		FROM recipes r
		JOIN users u ON r.author_id = u.id
		LEFT JOIN cultures c ON r.culture_id = c.id
		LEFT JOIN ratings rt ON rt.recipe_id = r.id
		WHERE r.author_id = ${user.id} AND r.status = 'published'
		GROUP BY r.id, u.username, u.display_name, u.prestige_score, c.${db(nameCol)}, c.slug
		ORDER BY r.created_at DESC
	`;

	return {
		profile: user,
		recipes: recipes as any[]
	};
};
