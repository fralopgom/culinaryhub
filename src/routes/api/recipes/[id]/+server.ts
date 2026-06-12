import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/db';
import { contentHash, ingredientsFingerprint } from '$lib/utils/hash';
import { slugify } from '$lib/utils/slug';

// GET /api/recipes/:id — detalle completo de una receta
export const GET: RequestHandler = async ({ params, url }) => {
	const lang    = url.searchParams.get('lang') === 'en' ? 'en' : 'es';
	const nameCol = lang === 'en' ? 'name_en' : 'name_es';

	const [recipe] = await db`
		SELECT
			r.*,
			u.username AS author_username, u.ethereum_address AS author_address,
			u.prestige_score AS author_prestige,
			c.${db(nameCol)} AS culture_name, c.slug AS culture_slug,
			COALESCE(AVG(rt.score), 0)::numeric(3,1) AS avg_score,
			COUNT(DISTINCT rt.id)::int AS rating_count
		FROM recipes r
		JOIN users u ON r.author_id = u.id
		LEFT JOIN cultures c ON r.culture_id = c.id
		LEFT JOIN ratings rt ON rt.recipe_id = r.id
		WHERE r.id = ${params.id}
		GROUP BY r.id, u.username, u.ethereum_address, u.prestige_score, c.${db(nameCol)}, c.slug
	`;

	if (!recipe) error(404);
	if (recipe.status === 'hidden') error(404);

	const ingredients = await db`
		SELECT
			ri.quantity, ri.unit, ri.notes_es, ri.notes_en, ri.sort_order,
			i.id AS ingredient_id, i.slug AS ingredient_slug,
			i.${db(lang === 'en' ? 'name_en' : 'name_es')} AS ingredient_name
		FROM recipe_ingredients ri
		JOIN ingredients i ON ri.ingredient_id = i.id
		WHERE ri.recipe_id = ${params.id}
		ORDER BY ri.sort_order
	`;

	const tags = await db`
		SELECT tag FROM recipe_tags WHERE recipe_id = ${params.id}
	`;

	const versions = await db`
		SELECT version, created_at, sygnet_cert_id
		FROM recipe_versions
		WHERE recipe_id = ${params.id}
		ORDER BY version DESC
	`;

	return json({ ...recipe, ingredients, tags: tags.map(t => t.tag), versions });
};

// PATCH /api/recipes/:id — edita una receta (crea nueva versión si está certificada)
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) error(401);

	const [recipe] = await db`
		SELECT r.id, r.author_id, r.version, rv.sygnet_cert_id,
		       u.id AS author_db_id
		FROM recipes r
		JOIN recipe_versions rv ON rv.recipe_id = r.id AND rv.version = r.version
		JOIN users u ON r.author_id = u.id
		WHERE r.id = ${params.id}
	`;

	if (!recipe) error(404);
	if (recipe.author_address !== locals.user.address) error(403);

	const body = await request.json();
	const { title, description, instructions, culture_id, ingredients, tags,
	        prep_time_min, cook_time_min, servings, difficulty, ai_level } = body;

	if (!title?.trim()) error(400, 'title_required');

	const canonical   = JSON.stringify({ title: title.trim(), description, instructions });
	const hash        = await contentHash(canonical);
	const ingredIds   = (ingredients ?? []).map((i: { ingredient_id: string }) => i.ingredient_id);
	const fingerprint = ingredIds.length ? await ingredientsFingerprint(ingredIds) : null;

	const isCertified = !!recipe.sygnet_cert_id;
	const newVersion  = isCertified ? recipe.version + 1 : recipe.version;

	await db.begin(async (db) => {
		await db`
			UPDATE recipes SET
				title                   = ${title.trim()},
				description             = ${description ?? null},
				instructions            = ${JSON.stringify(instructions)},
				culture_id              = ${culture_id ?? null},
				prep_time_min           = ${prep_time_min ?? null},
				cook_time_min           = ${cook_time_min ?? null},
				servings                = ${servings ?? null},
				difficulty              = ${difficulty ?? null},
				ai_level                = ${ai_level ?? 'none'},
				content_hash            = ${hash},
				ingredients_fingerprint = ${fingerprint},
				version                 = ${newVersion}
			WHERE id = ${params.id}
		`;

		await db`
			INSERT INTO recipe_versions (recipe_id, version, title, description, instructions, content_hash)
			VALUES (${params.id}, ${newVersion}, ${title.trim()}, ${description ?? null}, ${JSON.stringify(instructions)}, ${hash})
			ON CONFLICT (recipe_id, version) DO NOTHING
		`;

		if (ingredients) {
			await db`DELETE FROM recipe_ingredients WHERE recipe_id = ${params.id}`;
			if (ingredIds.length) {
				await db`
					INSERT INTO recipe_ingredients ${db(
						ingredients.map((i: { ingredient_id: string; quantity?: string; unit?: string; notes_es?: string; notes_en?: string; sort_order?: number }, idx: number) => ({
							recipe_id:     params.id,
							ingredient_id: i.ingredient_id,
							quantity:      i.quantity   ?? null,
							unit:          i.unit       ?? null,
							notes_es:      i.notes_es   ?? null,
							notes_en:      i.notes_en   ?? null,
							sort_order:    i.sort_order ?? idx
						}))
					)}
				`;
			}
		}

		if (tags) {
			await db`DELETE FROM recipe_tags WHERE recipe_id = ${params.id}`;
			if (tags.length) {
				await db`INSERT INTO recipe_tags ${db(tags.map((tag: string) => ({ recipe_id: params.id, tag })))}`;
			}
		}
	});

	return json({ id: params.id, version: newVersion, new_version_created: isCertified });
};
