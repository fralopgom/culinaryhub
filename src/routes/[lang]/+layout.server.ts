import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

const SUPPORTED_LANGS = ['es', 'en'];

export const load: LayoutServerLoad = async ({ params, locals }) => {
	if (!SUPPORTED_LANGS.includes(params.lang)) {
		error(404);
	}
	return { lang: params.lang, user: locals.user };
};
