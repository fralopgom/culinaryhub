<script lang="ts">
	import { t } from 'svelte-i18n';

	let { recipe, lang }: {
		recipe: {
			id: string; slug: string; title: string; description: string | null;
			author_username: string; culture_name: string | null;
			avg_score: string; rating_count: number;
			difficulty: string | null; ai_level: string;
			prep_time_min: number | null; cook_time_min: number | null;
		};
		lang: string;
	} = $props();
</script>

<article>
	<a href="/{lang}/recipes/{recipe.slug}">
		<h3>{recipe.title}</h3>
	</a>
	{#if recipe.description}
		<p>{recipe.description}</p>
	{/if}
	<footer>
		<span>{$t('recipe_by', { values: { author: recipe.author_username } })}</span>
		{#if recipe.culture_name}
			<span>{recipe.culture_name}</span>
		{/if}
		{#if recipe.rating_count > 0}
			<span>★ {recipe.avg_score} ({recipe.rating_count})</span>
		{/if}
		{#if recipe.prep_time_min}
			<span>{$t('recipe_prep_time', { values: { min: recipe.prep_time_min } })}</span>
		{/if}
	</footer>
</article>
