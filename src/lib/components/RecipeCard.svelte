<script lang="ts">
	import { t } from 'svelte-i18n';
	import { recipePhoto } from '$lib/utils/unsplash';

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

	const imgSrc = $derived(recipePhoto(recipe.slug));
</script>

<article class="card">
	<a class="card-img-wrap" href="/{lang}/recipes/{recipe.slug}" tabindex="-1" aria-hidden="true">
		<img src={imgSrc} alt={recipe.title} loading="lazy" />
		{#if recipe.culture_name}
			<span class="culture-pill">{recipe.culture_name}</span>
		{/if}
	</a>

	<div class="card-body">
		<a class="card-title" href="/{lang}/recipes/{recipe.slug}">
			<h3>{recipe.title}</h3>
		</a>
		{#if recipe.description}
			<p class="card-desc">{recipe.description}</p>
		{/if}
	</div>

	<footer class="card-footer">
		<span class="author">{$t('recipe_by', { values: { author: recipe.author_username } })}</span>
		<div class="meta">
			{#if recipe.rating_count > 0}
				<span class="rating">★ {recipe.avg_score}</span>
			{/if}
			{#if recipe.prep_time_min}
				<span class="tag">{recipe.prep_time_min} min</span>
			{/if}
			{#if recipe.difficulty}
				<span class="tag">{recipe.difficulty}</span>
			{/if}
		</div>
	</footer>
</article>

<style>
.card {
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: var(--radius-lg);
	overflow: hidden;
	box-shadow: var(--shadow-sm);
	transition: box-shadow 0.25s, transform 0.25s;
	display: flex;
	flex-direction: column;
}
.card:hover { box-shadow: var(--shadow-lg); transform: translateY(-4px); }

/* Image */
.card-img-wrap {
	position: relative;
	display: block;
	height: 200px;
	overflow: hidden;
	flex-shrink: 0;
}
.card-img-wrap img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	transition: transform 0.4s ease;
}
.card:hover .card-img-wrap img { transform: scale(1.04); }

.culture-pill {
	position: absolute;
	bottom: 0.6rem;
	left: 0.6rem;
	background: rgba(26, 22, 20, 0.72);
	backdrop-filter: blur(4px);
	color: #fff;
	font-size: 0.7rem;
	font-weight: 600;
	padding: 0.2rem 0.55rem;
	border-radius: 999px;
	letter-spacing: 0.03em;
}

/* Body */
.card-body {
	padding: 1rem 1.15rem 0.5rem;
	flex: 1;
}

.card-title { text-decoration: none; color: var(--text); }
.card-title:hover { color: var(--accent); text-decoration: none; }
.card-title h3 { line-height: 1.35; }

.card-desc {
	color: var(--muted);
	font-size: 0.875rem;
	line-height: 1.55;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
	margin-top: 0.35rem;
}

/* Footer */
.card-footer {
	padding: 0.6rem 1.15rem 0.9rem;
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 0.5rem;
	border-top: 1px solid var(--border);
	margin-top: auto;
}

.author { font-size: 0.75rem; color: var(--muted); }

.meta {
	display: flex;
	gap: 0.35rem;
	align-items: center;
	flex-shrink: 0;
}
.tag {
	font-size: 0.68rem;
	background: var(--cream);
	border: 1px solid var(--border);
	padding: 0.15rem 0.45rem;
	border-radius: 999px;
	color: var(--muted);
}
.rating { font-size: 0.8rem; color: var(--accent); font-weight: 700; }
</style>
