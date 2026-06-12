import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import db from '$lib/server/db';

export const load: PageServerLoad = async ({ params }) => {
	const nameCol = params.lang === 'en' ? 'name_en' : 'name_es';
	const descCol = params.lang === 'en' ? 'description_en' : 'description_es';

	const [culture] = await db`
		SELECT id, slug, ${db(nameCol)} AS name, ${db(descCol)} AS description, level
		FROM cultures WHERE slug = ${params.slug}
	`;
	if (!culture) error(404);

	const recipes = await db`
		SELECT r.id, r.slug, r.title, r.description, r.difficulty, r.ai_level,
		       r.prep_time_min, r.cook_time_min,
		       u.username AS author_username, u.prestige_score AS author_prestige,
		       NULL AS culture_name, NULL AS culture_slug,
		       COALESCE(AVG(rt.score), 0)::numeric(3,1) AS avg_score,
		       COUNT(DISTINCT rt.id)::int AS rating_count
		FROM recipes r
		JOIN users u ON r.author_id = u.id
		LEFT JOIN ratings rt ON rt.recipe_id = r.id
		WHERE r.culture_id = ${culture.id} AND r.status = 'published'
		GROUP BY r.id, u.username, u.prestige_score
		ORDER BY r.created_at DESC
	`;

	return { culture, recipes };
};
