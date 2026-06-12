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
		<li>
			<a href="/{data.lang}/cultures/{c.slug}">{c.name}</a>
			{#if c.recipe_count > 0}<span>({c.recipe_count})</span>{/if}
			{#if children(c.id).length}
				<ul>{@render tree(c.id)}</ul>
			{/if}
		</li>
	{/each}
{/snippet}

<ul>{@render tree(null)}</ul>
