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

<article class="card">
	<a class="card-title" href="/{lang}/recipes/{recipe.slug}">
		<h3>{recipe.title}</h3>
	</a>
	{#if recipe.description}
		<p class="card-desc">{recipe.description}</p>
	{/if}
	<footer>
		<span class="author">{$t('recipe_by', { values: { author: recipe.author_username } })}</span>
		<div class="meta">
			{#if recipe.culture_name}
				<span class="tag">{recipe.culture_name}</span>
			{/if}
			{#if recipe.rating_count > 0}
				<span class="rating">★ {recipe.avg_score}</span>
			{/if}
			{#if recipe.prep_time_min}
				<span class="tag">{recipe.prep_time_min} min</span>
			{/if}
		</div>
	</footer>
</article>

<style>
.card {
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	padding: 1rem 1.25rem;
	box-shadow: var(--shadow-sm);
	transition: box-shadow 0.15s, transform 0.15s;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}
.card:hover { box-shadow: var(--shadow); transform: translateY(-2px); }

.card-title { text-decoration: none; color: var(--text); }
.card-title:hover { color: var(--accent); text-decoration: none; }
.card-title h3 { font-size: 1rem; line-height: 1.3; }

.card-desc {
	color: var(--muted);
	font-size: 0.875rem;
	line-height: 1.5;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
	margin: 0;
	flex: 1;
}

footer {
	margin-top: auto;
	border-top: 1px solid var(--border);
	padding-top: 0.6rem;
	display: flex;
	flex-direction: column;
	gap: 0.4rem;
}

.author { font-size: 0.75rem; color: var(--muted); }

.meta {
	display: flex;
	flex-wrap: wrap;
	gap: 0.4rem;
	align-items: center;
}

.tag {
	font-size: 0.7rem;
	background: var(--bg);
	border: 1px solid var(--border);
	padding: 0.15rem 0.5rem;
	border-radius: 999px;
	color: var(--muted);
}

.rating { font-size: 0.8rem; color: var(--accent); font-weight: 600; }
</style>
