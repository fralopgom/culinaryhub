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

<section>
	<h1>{$t('home_hero_title')}</h1>
	<p>{$t('home_hero_subtitle')}</p>
	<a href="/{data.lang}/recipes">{$t('home_cta_browse')}</a>
	{#if data.user}
		<a href="/{data.lang}/recipes/new">{$t('home_cta_publish')}</a>
	{/if}
</section>

{#if data.recipes.length}
	<section>
		{#each data.recipes as recipe}
			<RecipeCard {recipe} lang={data.lang} />
		{/each}
	</section>
{/if}
