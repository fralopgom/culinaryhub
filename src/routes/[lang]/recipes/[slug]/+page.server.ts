import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import db from '$lib/server/db';

export const load: PageServerLoad = async ({ params }) => {
	const nameCol = params.lang === 'en' ? 'name_en' : 'name_es';
	const ingNameCol = params.lang === 'en' ? 'name_en' : 'name_es';

	const [recipe] = await db`
		SELECT r.*, u.username AS author_username, u.address AS author_address,
		       u.prestige_score AS author_prestige,
		       c.${db(nameCol)} AS culture_name, c.slug AS culture_slug,
		       COALESCE(AVG(rt.score), 0)::numeric(3,1) AS avg_score,
		       COUNT(DISTINCT rt.id)::int AS rating_count
		FROM recipes r
		JOIN users u ON r.author_id = u.id
		LEFT JOIN cultures c ON r.culture_id = c.id
		LEFT JOIN ratings rt ON rt.recipe_id = r.id
		WHERE r.slug = ${params.slug} AND r.status != 'hidden'
		GROUP BY r.id, u.username, u.address, u.prestige_score, c.${db(nameCol)}, c.slug
	`;
	if (!recipe) error(404);

	const [ingredients, tags, versions] = await Promise.all([
		db`
			SELECT ri.quantity, ri.unit, ri.notes_es, ri.notes_en, ri.sort_order,
			       i.slug AS ingredient_slug, i.${db(ingNameCol)} AS name
			FROM recipe_ingredients ri
			JOIN ingredients i ON ri.ingredient_id = i.id
			WHERE ri.recipe_id = ${recipe.id}
			ORDER BY ri.sort_order
		`,
		db`SELECT tag FROM recipe_tags WHERE recipe_id = ${recipe.id} ORDER BY tag`,
		db`SELECT version, created_at, sygnet_cert_id FROM recipe_versions WHERE recipe_id = ${recipe.id} ORDER BY version DESC`
	]);

	return {
		recipe,
		ingredients,
		tags: (tags as any[]).map((t) => t.tag as string),
		versions
	};
};
