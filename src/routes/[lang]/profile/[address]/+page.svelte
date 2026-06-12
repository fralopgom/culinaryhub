<script lang="ts">
	import { t } from 'svelte-i18n';
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import PrestigeBadge from '$lib/components/PrestigeBadge.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let { profile, recipes, sygnet_prestige } = $derived(data);
</script>

<svelte:head>
	<title>{profile.username} — {$t('meta_site_name')}</title>
</svelte:head>

<h1>{profile.username}</h1>
<p>{profile.ethereum_address}</p>

<section>
	<p>{$t('profile_prestige')}: <PrestigeBadge score={profile.prestige_score} tier={profile.wallet_tier} /></p>
	{#if sygnet_prestige !== null}
		<p>{$t('profile_sygnet_badge')}: <PrestigeBadge score={sygnet_prestige} /></p>
	{/if}
	<p>{$t('profile_recipes_published')}: {recipes.length}</p>
	<p>{$t('profile_member_since', { values: { date: new Date(profile.created_at).toLocaleDateString(data.lang) } })}</p>
</section>

{#if recipes.length}
	<section>
		{#each recipes as recipe}
			<RecipeCard {recipe} lang={data.lang} />
		{/each}
	</section>
{/if}
