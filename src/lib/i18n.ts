import { addMessages, init } from 'svelte-i18n';
import es from '../../messages/es.json';
import en from '../../messages/en.json';

addMessages('es', es);
addMessages('en', en);

init({ fallbackLocale: 'es', initialLocale: 'es' });
