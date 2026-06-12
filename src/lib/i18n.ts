import { register, init, getLocaleFromNavigator } from 'svelte-i18n';

register('es', () => import('../../messages/es.json'));
register('en', () => import('../../messages/en.json'));

init({
	fallbackLocale: 'es',
	initialLocale: getLocaleFromNavigator()
});
