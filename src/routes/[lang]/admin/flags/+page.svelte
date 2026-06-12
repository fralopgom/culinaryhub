<script lang="ts">
	import { t } from 'svelte-i18n';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>{$t('admin_flags')} — {$t('admin_dashboard')}</title></svelte:head>

<h1>{$t('admin_flags')}</h1>
<a href="/{data.lang}/admin">←</a>

{#each data.flagged as item}
	<article>
		<h3><a href="/{data.lang}/recipes/{item.slug}">{item.title}</a></h3>
		<p>
			{$t('admin_flagged_by', { values: { count: item.flag_count, weight: item.total_weight } })}
			· {$t('recipe_by', { values: { author: item.author_username } })}
			· status: {item.status}
		</p>
		<ul>
			{#each item.flags as f}
				<li>{f.reason}{#if f.detail} — {f.detail}{/if}</li>
			{/each}
		</ul>

		<form method="POST" action="?/confirm_flags" use:enhance>
			<input type="hidden" name="recipe_id" value={item.recipe_id} />
			<input type="text"   name="reason" placeholder={$t('admin_reason_placeholder')} required />
			<button type="submit">{$t('admin_hide_recipe')}</button>
		</form>

		<form method="POST" action="?/dismiss_flags" use:enhance>
			<input type="hidden" name="recipe_id" value={item.recipe_id} />
			<input type="text"   name="reason" placeholder={$t('admin_reason_placeholder')} required />
			<button type="submit">{$t('admin_dismiss_flag')}</button>
		</form>

		<form method="POST" action="?/ban_wallet" use:enhance>
			<input type="hidden" name="address" value={item.author_address} />
			<input type="text"   name="reason" placeholder={$t('admin_reason_placeholder')} required />
			<button type="submit">{$t('admin_ban_wallet')}</button>
		</form>
	</article>
{:else}
	<p>—</p>
{/each}
