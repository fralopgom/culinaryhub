import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url, locals }) => {
	const lang = url.pathname.startsWith('/en') ? 'en' : 'es';
	return { lang, user: locals.user };
};
