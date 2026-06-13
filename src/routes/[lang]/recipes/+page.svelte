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

<div class="page-header">
	<h1>{$t('nav_recipes')}</h1>

	<div class="filters">
		<form class="search-form" onsubmit={(e) => { e.preventDefault(); applyFilter('search', search || null); }}>
			<input type="search" bind:value={search} placeholder="…" />
			<button type="submit">🔍</button>
		</form>

		<select onchange={(e) => applyFilter('culture', (e.target as HTMLSelectElement).value || null)}>
			<option value="">{$t('recipe_culture')}</option>
			{#each data.cultures as c}
				<option value={c.id} selected={c.id === data.culture_id}>{c.name}</option>
			{/each}
		</select>
	</div>
</div>

{#if data.recipes.length}
	<div class="grid">
		{#each data.recipes as recipe}
			<RecipeCard {recipe} lang={data.lang} />
		{/each}
	</div>

	<nav class="pagination">
		{#if data.page > 1}
			<a href="?page={data.page - 1}">← {$t('nav_prev') ?? 'Anterior'}</a>
		{/if}
		<a href="?page={data.page + 1}">{$t('nav_next') ?? 'Siguiente'} →</a>
	</nav>
{:else}
	<p class="empty">{$t('error_not_found')}</p>
{/if}

<style>
.page-header { margin-bottom: 1.5rem; }

.filters {
	display: flex;
	gap: 0.75rem;
	margin-top: 1rem;
	flex-wrap: wrap;
}

.search-form {
	display: flex;
	gap: 0.5rem;
	flex: 1;
	min-width: 200px;
}
.search-form input { flex: 1; }
.search-form button {
	padding: 0.5rem 0.85rem;
	background: var(--accent);
	color: #fff;
	border: none;
	border-radius: var(--radius);
	cursor: pointer;
}

.filters select { min-width: 160px; }

.pagination {
	display: flex;
	justify-content: center;
	gap: 1rem;
	margin-top: 2rem;
	padding-top: 1rem;
	border-top: 1px solid var(--border);
}

.empty { color: var(--muted); margin-top: 2rem; text-align: center; }
</style>
