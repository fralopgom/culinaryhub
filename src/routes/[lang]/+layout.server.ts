import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import db from '$lib/server/db';

const SUPPORTED = ['es', 'en'];

export const load: LayoutServerLoad = async ({ params, locals }) => {
	if (!SUPPORTED.includes(params.lang)) error(404);

	let unread_notifications = 0;
	if (locals.user) {
		const [row] = await db`
			SELECT COUNT(*)::int AS count FROM notifications
			WHERE user_id = ${locals.user.id} AND read = false
		`;
		unread_notifications = row?.count ?? 0;
	}

	return { lang: params.lang, user: locals.user, unread_notifications };
};
