import type { PageServerLoad } from './$types';
import db from '$lib/server/db';

export const load: PageServerLoad = async ({ params, url }) => {
	const lang       = params.lang;
	const nameCol    = lang === 'en' ? 'name_en' : 'name_es';
	const culture_id = url.searchParams.get('culture') || null;
	const search     = url.searchParams.get('search') || null;
	const tag        = url.searchParams.get('tag') || null;
	const page       = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
	const limit      = 24;
	const offset     = (page - 1) * limit;

	const [recipes, cultures] = await Promise.all([
		db`
			SELECT r.id, r.slug, r.title, r.description, r.difficulty, r.ai_level,
			       r.prep_time_min, r.cook_time_min,
			       u.username AS author_username, u.prestige_score AS author_prestige,
			       c.${db(nameCol)} AS culture_name, c.slug AS culture_slug,
			       COALESCE(AVG(rt.score), 0)::numeric(3,1) AS avg_score,
			       COUNT(DISTINCT rt.id)::int AS rating_count
			FROM recipes r
			JOIN users u ON r.author_id = u.id
			LEFT JOIN cultures c ON r.culture_id = c.id
			LEFT JOIN ratings rt ON rt.recipe_id = r.id
			WHERE r.status = 'published'
			  ${culture_id ? db`AND r.culture_id = ${culture_id}` : db``}
			  ${search     ? db`AND r.search_vector @@ plainto_tsquery('spanish', ${search})` : db``}
			  ${tag        ? db`AND EXISTS (SELECT 1 FROM recipe_tags WHERE recipe_id = r.id AND tag = ${tag})` : db``}
			GROUP BY r.id, u.username, u.prestige_score, c.${db(nameCol)}, c.slug
			ORDER BY r.created_at DESC
			LIMIT ${limit} OFFSET ${offset}
		`,
		db`SELECT id, slug, ${db(nameCol)} AS name FROM cultures WHERE level = 1 ORDER BY name`
	]);

	return { recipes, cultures, page, search, culture_id, tag };
};
