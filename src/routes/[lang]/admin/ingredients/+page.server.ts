import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import db from '$lib/server/db';
import { isAdmin } from '$lib/server/admin';
import { slugify } from '$lib/utils/slug';

export const load: PageServerLoad = async ({ locals }) => {
	if (!isAdmin(locals.user?.address)) error(403);
	const ingredients = await db`SELECT id, slug, name_es, name_en, category FROM ingredients ORDER BY name_es`;
	return { ingredients };
};

export const actions: Actions = {
	add: async ({ request, locals }) => {
		if (!isAdmin(locals.user?.address)) error(403);
		const data    = await request.formData();
		const name_es = (data.get('name_es') as string)?.trim();
		const name_en = (data.get('name_en') as string)?.trim();
		const category = (data.get('category') as string) || null;

		if (!name_es || !name_en) return fail(400, { error: 'names_required' });

		const slug = slugify(name_es) + '-' + Date.now().toString(36);
		await db`
			INSERT INTO ingredients (slug, name_es, name_en, category)
			VALUES (${slug}, ${name_es}, ${name_en}, ${category})
		`;
		return { success: true };
	},

	delete: async ({ request, locals }) => {
		if (!isAdmin(locals.user?.address)) error(403);
		const data = await request.formData();
		const id   = data.get('id') as string;

		const [{ count }] = await db`SELECT COUNT(*)::int AS count FROM recipe_ingredients WHERE ingredient_id = ${id}`;
		if (count > 0) return fail(409, { error: 'ingredient_in_use' });

		await db`DELETE FROM ingredients WHERE id = ${id}`;
		return { success: true };
	}
};
