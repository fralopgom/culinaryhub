import db from './db';

// Creates a draft seed recipe so new users have something to see and edit
export async function createSeedRecipe(userId: string, lang: 'es' | 'en' = 'es') {
	const slug = `mi-primera-receta-${Date.now().toString(36)}`;
	const title = lang === 'en' ? 'My first recipe' : 'Mi primera receta';
	const description = lang === 'en'
		? 'Edit this draft and publish your first recipe!'
		: '¡Edita este borrador y publica tu primera receta!';
	const instructions = lang === 'en'
		? ['Describe the first step here.', 'Add as many steps as you need.']
		: ['Describe aquí el primer paso.', 'Añade todos los pasos que necesites.'];
	const ingredients = lang === 'en'
		? ['Ingredient 1', 'Ingredient 2']
		: ['Ingrediente 1', 'Ingrediente 2'];

	await db`
		INSERT INTO recipes
			(slug, author_id, title, description, instructions, free_ingredients, status)
		VALUES
			(${slug}, ${userId}, ${title}, ${description}, ${instructions}, ${ingredients}, 'draft')
		ON CONFLICT DO NOTHING
	`;
}
