import { redirect } from '@sveltejs/kit';
import { deleteSession } from '$lib/server/auth';

export const POST = async ({ cookies, url }) => {
	const token = cookies.get('culinaryhub_session');
	if (token) {
		await deleteSession(token);
		cookies.delete('culinaryhub_session', { path: '/' });
	}
	const lang = url.searchParams.get('lang') ?? 'es';
	redirect(302, `/${lang}`);
};
