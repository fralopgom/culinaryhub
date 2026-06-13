<script lang="ts">
	import { t } from 'svelte-i18n';
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{$t('meta_home_title')}</title>
	<meta name="description" content={$t('meta_home_description')} />
	<meta property="og:title"       content={$t('meta_home_title')} />
	<meta property="og:description" content={$t('meta_home_description')} />
	<meta property="og:type"        content="website" />
</svelte:head>

<section class="hero">
	<h1>{$t('home_hero_title')}</h1>
	<p>{$t('home_hero_subtitle')}</p>
	<div class="hero-actions">
		<a href="/{data.lang}/recipes" class="btn-primary">{$t('home_cta_browse')}</a>
		{#if data.user}
			<a href="/{data.lang}/recipes/new" class="btn-secondary">{$t('home_cta_publish')}</a>
		{/if}
	</div>
</section>

{#if data.recipes.length}
	<section>
		<h2>{$t('nav_recipes')}</h2>
		<div class="grid">
			{#each data.recipes as recipe}
				<RecipeCard {recipe} lang={data.lang} />
			{/each}
		</div>
	</section>
{/if}

<style>
.hero { text-align: center; padding: clamp(2.5rem, 10vw, 6rem) 0 clamp(2rem, 6vw, 4rem); }
.hero h1 { color: var(--text); }
.hero p { color: var(--muted); font-size: clamp(1rem, 2.5vw, 1.2rem); margin: 0.75rem auto 2rem; max-width: 560px; }

.btn-primary, .btn-secondary {
	display: inline-block;
	padding: 0.65rem 1.5rem;
	border-radius: var(--radius);
	font-weight: 600;
	font-size: 0.95rem;
	text-decoration: none;
	transition: background 0.15s, transform 0.1s;
}
.btn-primary  { background: var(--accent); color: #fff; }
.btn-primary:hover  { background: var(--accent-dark); color: #fff; text-decoration: none; transform: translateY(-1px); }
.btn-secondary { background: var(--surface); color: var(--text); border: 1px solid var(--border); }
.btn-secondary:hover { background: var(--bg); text-decoration: none; transform: translateY(-1px); }

section + section { margin-top: 2rem; }
</style>
