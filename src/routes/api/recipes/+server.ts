import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/db';
import { walletCanPublish, dailyLimitReached } from '$lib/server/limits';
import { contentHash, ingredientsFingerprint } from '$lib/utils/hash';
import { slugify } from '$lib/utils/slug';

// GET /api/recipes?lang=es&culture=uuid&search=text&tag=tag&page=1&limit=20
export const GET: RequestHandler = async ({ url }) => {
	const lang       = url.searchParams.get('lang') === 'en' ? 'en' : 'es';
	const culture_id = url.searchParams.get('culture') || null;
	const search     = url.searchParams.get('search') || null;
	const tag        = url.searchParams.get('tag') || null;
	const page       = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
	const limit      = Math.min(50, parseInt(url.searchParams.get('limit') ?? '20'));
	const offset     = (page - 1) * limit;
	const nameCol    = lang === 'en' ? 'name_en' : 'name_es';

	const recipes = await db`
		SELECT
			r.id, r.slug, r.title, r.description, r.difficulty, r.ai_level,
			r.prep_time_min, r.cook_time_min, r.servings, r.created_at,
			r.ingredients_fingerprint, r.version,
			u.username   AS author_username,
			u.prestige_score AS author_prestige,
			c.${db(nameCol)} AS culture_name, c.slug AS culture_slug,
			COALESCE(AVG(rt.score), 0)::numeric(3,1) AS avg_score,
			COUNT(DISTINCT rt.id)::int AS rating_count
		FROM recipes r
		JOIN users u ON r.author_id = u.id
		LEFT JOIN cultures c ON r.culture_id = c.id
		LEFT JOIN ratings rt ON rt.recipe_id = r.id
		WHERE r.status = 'published'
		  ${culture_id ? db`AND r.culture_id   = ${culture_id}` : db``}
		  ${search     ? db`AND r.search_vector @@ plainto_tsquery('spanish', ${search})` : db``}
		  ${tag        ? db`AND EXISTS (SELECT 1 FROM recipe_tags WHERE recipe_id = r.id AND tag = ${tag})` : db``}
		GROUP BY r.id, u.username, u.prestige_score, c.${db(nameCol)}, c.slug
		ORDER BY r.created_at DESC
		LIMIT ${limit} OFFSET ${offset}
	`;

	return json({ recipes, page, limit });
};

// POST /api/recipes
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401);

	const { user } = locals;

	if (!walletCanPublish(user.wallet_tier)) error(403, 'wallet_tier_insufficient');

	if (await dailyLimitReached(user.id, user.wallet_tier, user.prestige_score)) {
		error(429, 'daily_limit_reached');
	}

	const body = await request.json();

	// Honeypot — bots fill this field, humans don't
	if (body.website) return json({ ok: true }, { status: 201 }); // silent discard

	const { title, description, instructions, culture_id, ingredients, tags,
	        prep_time_min, cook_time_min, servings, difficulty, ai_level,
	        license_accepted } = body;

	if (!title?.trim())     error(400, 'title_required');
	if (!license_accepted)  error(400, 'license_required');
	if (!Array.isArray(instructions) || instructions.length === 0) error(400, 'instructions_required');

	const canonical   = JSON.stringify({ title: title.trim(), description, instructions });
	const hash        = await contentHash(canonical);
	const ingredIds   = (ingredients ?? []).map((i: { ingredient_id: string }) => i.ingredient_id);
	const fingerprint = ingredIds.length ? await ingredientsFingerprint(ingredIds) : null;

	// Check duplicate content
	const [existing] = await db`SELECT id FROM recipes WHERE content_hash = ${hash} LIMIT 1`;
	if (existing) error(409, 'duplicate_content');

	// Check ingredient overlap (warn, don't block)
	const overlap = fingerprint
		? await db`SELECT COUNT(*)::int AS count FROM recipes WHERE ingredients_fingerprint = ${fingerprint} AND status = 'published'`
		: [{ count: 0 }];

	// Resolve author's DB id from ethereum_address
	const [author] = await db`SELECT id, wallet_tier, prestige_score FROM users WHERE ethereum_address = ${user.address}`;
	if (!author) error(401);

	const baseSlug = slugify(title);
	const slug     = `${baseSlug}-${Date.now().toString(36)}`;

	const recipe = await db.begin(async (db) => {
		const [r] = await db`
			INSERT INTO recipes
				(slug, author_id, culture_id, title, description, instructions,
				 prep_time_min, cook_time_min, servings, difficulty, ai_level,
				 content_hash, ingredients_fingerprint, status)
			VALUES
				(${slug}, ${author.id}, ${culture_id ?? null}, ${title.trim()},
				 ${description ?? null}, ${JSON.stringify(instructions)},
				 ${prep_time_min ?? null}, ${cook_time_min ?? null},
				 ${servings ?? null}, ${difficulty ?? null}, ${ai_level ?? 'none'},
				 ${hash}, ${fingerprint}, 'published')
			RETURNING id, slug, title, version
		`;

		await db`
			INSERT INTO recipe_versions (recipe_id, version, title, description, instructions, content_hash)
			VALUES (${r.id}, 1, ${title.trim()}, ${description ?? null}, ${JSON.stringify(instructions)}, ${hash})
		`;

		if (ingredIds.length) {
			await db`
				INSERT INTO recipe_ingredients ${db(
					ingredients.map((i: { ingredient_id: string; quantity?: string; unit?: string; notes_es?: string; notes_en?: string; sort_order?: number }, idx: number) => ({
						recipe_id:     r.id,
						ingredient_id: i.ingredient_id,
						quantity:      i.quantity      ?? null,
						unit:          i.unit          ?? null,
						notes_es:      i.notes_es      ?? null,
						notes_en:      i.notes_en      ?? null,
						sort_order:    i.sort_order    ?? idx
					}))
				)}
			`;
		}

		if (tags?.length) {
			await db`
				INSERT INTO recipe_tags ${db(tags.map((tag: string) => ({ recipe_id: r.id, tag })))}
			`;
		}

		await db`
			INSERT INTO prestige_events (user_id, source, points, reference_id)
			VALUES (${author.id}, 'recipe_published', 5, ${r.id})
		`;

		return r;
	});

	return json(
		{ recipe, overlap_count: overlap[0].count },
		{ status: 201 }
	);
};
