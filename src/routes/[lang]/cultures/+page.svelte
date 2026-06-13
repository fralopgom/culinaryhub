<script lang="ts">
	import { t } from 'svelte-i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Culture = { id: string; slug: string; name: string; parent_id: string | null; level: number; recipe_count: number };

	function children(parentId: string | null): Culture[] {
		return data.cultures.filter((c: Culture) => c.parent_id === parentId);
	}
</script>

<svelte:head>
	<title>{$t('nav_cultures')} — {$t('meta_site_name')}</title>
</svelte:head>

<h1>{$t('nav_cultures')}</h1>

{#snippet tree(parentId: string | null)}
	{#each children(parentId) as c}
		<li class="culture-item" class:root={c.level === 0}>
			<a href="/{data.lang}/cultures/{c.slug}">{c.name}</a>
			{#if c.recipe_count > 0}
				<span class="count">{c.recipe_count}</span>
			{/if}
			{#if children(c.id).length}
				<ul>{@render tree(c.id)}</ul>
			{/if}
		</li>
	{/each}
{/snippet}

<ul class="culture-tree">{@render tree(null)}</ul>

<style>
h1 { margin-bottom: 1.5rem; }

.culture-tree { list-style: none; padding: 0; }
.culture-tree ul { list-style: none; padding-left: 1.25rem; border-left: 2px solid var(--border); margin: 0.25rem 0 0.25rem 0.5rem; }

.culture-item { padding: 0.3rem 0; display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; }
.culture-item.root > a { font-weight: 600; font-size: 1rem; }
.culture-item > a { color: var(--text); text-decoration: none; }
.culture-item > a:hover { color: var(--accent); }

.count {
	font-size: 0.75rem;
	color: var(--muted);
	background: var(--bg);
	border: 1px solid var(--border);
	padding: 0.1rem 0.45rem;
	border-radius: 999px;
}

/* Make root level items look like sections */
.culture-tree > .culture-item { border-bottom: 1px solid var(--border); padding: 0.75rem 0; }
.culture-tree > .culture-item:last-child { border-bottom: none; }
</style>
