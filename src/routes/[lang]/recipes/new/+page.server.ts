import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import db from '$lib/server/db';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) redirect(303, `/${params.lang}`);

	const nameCol = params.lang === 'en' ? 'name_en' : 'name_es';
	const [cultures, ingredients] = await Promise.all([
		db`SELECT id, slug, ${db(nameCol)} AS name, parent_id, level FROM cultures ORDER BY level, name`,
		db`SELECT id, slug, ${db(nameCol)} AS name, category FROM ingredients ORDER BY name`
	]);

	return { cultures: cultures as any[], ingredients: ingredients as any[] };
};
