import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import db from '$lib/server/db';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) redirect(303, `/${params.lang}`);

	const nameCol = params.lang === 'en' ? 'name_en' : 'name_es';
	const cultures = await db`
		SELECT id, ${db(nameCol)} AS name, level
		FROM cultures
		ORDER BY level, name
	`;

	return { cultures: cultures as any[] };
};
