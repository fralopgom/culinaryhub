import type { PageServerLoad } from './$types';
import db from '$lib/server/db';

export const load: PageServerLoad = async ({ params }) => {
	const nameCol = params.lang === 'en' ? 'name_en' : 'name_es';
	const cultures = await db`
		SELECT id, slug, ${db(nameCol)} AS name, parent_id, level,
		       COUNT(r.id)::int AS recipe_count
		FROM cultures c
		LEFT JOIN recipes r ON r.culture_id = c.id AND r.status = 'published'
		GROUP BY c.id
		ORDER BY c.level, name
	`;
	return { cultures };
};
