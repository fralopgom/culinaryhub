import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import db from '$lib/server/db';
import { isAdmin } from '$lib/server/admin';
import { slugify } from '$lib/utils/slug';

export const load: PageServerLoad = async ({ locals }) => {
	if (!isAdmin(locals.user)) error(403);
	const cultures = await db`SELECT id, slug, name_es, name_en, parent_id, level FROM cultures ORDER BY level, name_es`;
	return { cultures };
};

export const actions: Actions = {
	add: async ({ request, locals }) => {
		if (!isAdmin(locals.user)) error(403);
		const data      = await request.formData();
		const name_es   = (data.get('name_es') as string)?.trim();
		const name_en   = (data.get('name_en') as string)?.trim();
		const parent_id = (data.get('parent_id') as string) || null;
		const desc_es   = (data.get('description_es') as string) || null;
		const desc_en   = (data.get('description_en') as string) || null;

		if (!name_es || !name_en) return fail(400, { error: 'names_required' });

		const [parent] = parent_id ? await db`SELECT level FROM cultures WHERE id = ${parent_id}` : [null];
		const level    = parent ? parent.level + 1 : 0;
		const slug     = slugify(name_es) + '-' + Date.now().toString(36);

		await db`
			INSERT INTO cultures (slug, name_es, name_en, description_es, description_en, parent_id, level)
			VALUES (${slug}, ${name_es}, ${name_en}, ${desc_es}, ${desc_en}, ${parent_id}, ${level})
		`;
		return { success: true };
	},

	delete: async ({ request, locals }) => {
		if (!isAdmin(locals.user)) error(403);
		const data = await request.formData();
		const id   = data.get('id') as string;

		const [{ count }] = await db`SELECT COUNT(*)::int AS count FROM recipes WHERE culture_id = ${id}`;
		if (count > 0) return fail(409, { error: 'culture_has_recipes' });

		await db`DELETE FROM cultures WHERE id = ${id}`;
		return { success: true };
	}
};
