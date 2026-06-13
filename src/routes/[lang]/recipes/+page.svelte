<script lang="ts">
	import { t } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let search = $state('');
	$effect(() => { search = data.search ?? ''; });

	function applyFilter(key: string, value: string | null) {
		const u = new URL(window.location.href);
		if (value) u.searchParams.set(key, value);
		else u.searchParams.delete(key);
		u.searchParams.delete('page');
		goto(u.toString());
	}
</script>

<svelte:head>
	<title>{$t('nav_recipes')} — {$t('meta_site_name')}</title>
</svelte:head>

<h1>{$t('nav_recipes')}</h1>

<form onsubmit={(e) => { e.preventDefault(); applyFilter('search', search || null); }}>
	<input type="search" bind:value={search} placeholder="…" />
	<button type="submit">🔍</button>
</form>

<select onchange={(e) => applyFilter('culture', (e.target as HTMLSelectElement).value || null)}>
	<option value="">{$t('recipe_culture')}</option>
	{#each data.cultures as c}
		<option value={c.id} selected={c.id === data.culture_id}>{c.name}</option>
	{/each}
</select>

{#if data.recipes.length}
	<section>
		{#each data.recipes as recipe}
			<RecipeCard {recipe} lang={data.lang} />
		{/each}
	</section>

	{#if data.page > 1}
		<a href="?page={data.page - 1}">←</a>
	{/if}
	<a href="?page={data.page + 1}">→</a>
{:else}
	<p>{$t('error_not_found')}</p>
{/if}
