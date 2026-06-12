<script lang="ts">
	import { t } from 'svelte-i18n';
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.culture.name} — {$t('meta_site_name')}</title>
	<meta name="description" content={data.culture.description ?? ''} />
</svelte:head>

<h1>{data.culture.name}</h1>
{#if data.culture.description}<p>{data.culture.description}</p>{/if}

{#if data.recipes.length}
	<section>
		{#each data.recipes as recipe}
			<RecipeCard {recipe} lang={data.lang} />
		{/each}
	</section>
{:else}
	<p>{$t('error_not_found')}</p>
{/if}
