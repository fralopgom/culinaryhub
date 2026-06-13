<script lang="ts">
	import { t } from 'svelte-i18n';
	import { invalidateAll } from '$app/navigation';
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import PrestigeBadge from '$lib/components/PrestigeBadge.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let { profile, recipes } = $derived(data);

	const displayName = $derived(profile.display_name || profile.username);
	const isOwn = $derived(data.user?.id === profile.id);

	let editing   = $state(false);
	let aliasInput = $state(profile.display_name ?? '');
	let saving    = $state(false);
	let aliasError = $state('');

	async function saveAlias() {
		saving = true;
		aliasError = '';
		const res = await fetch('/api/profile', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ display_name: aliasInput })
		});
		saving = false;
		if (res.ok) {
			editing = false;
			await invalidateAll();
		} else {
			const body = await res.json().catch(() => ({}));
			aliasError = body.message ?? `Error ${res.status}`;
		}
	}
</script>

<svelte:head>
	<title>{displayName} — {$t('meta_site_name')}</title>
</svelte:head>

<section class="profile-header">
	{#if editing}
		<div class="alias-edit">
			<input
				class="alias-input"
				bind:value={aliasInput}
				maxlength="50"
				placeholder={$t('profile_alias_placeholder')}
			/>
			<button class="btn btn-primary" onclick={saveAlias} disabled={saving}>
				{saving ? '…' : $t('profile_alias_save')}
			</button>
			<button class="btn" onclick={() => { editing = false; aliasInput = profile.display_name ?? ''; }}>
				{$t('cancel')}
			</button>
			{#if aliasError}<p class="error">{aliasError}</p>{/if}
		</div>
	{:else}
		<h1>
			{displayName}
			{#if isOwn}
				<button class="edit-alias-btn" onclick={() => editing = true} aria-label={$t('profile_alias_edit')}>✏️</button>
			{/if}
		</h1>
	{/if}

	<div class="profile-meta">
		<PrestigeBadge score={profile.prestige_score} tier={profile.wallet_tier} />
		<span class="meta-item">{$t('profile_recipes_published')}: {recipes.length}</span>
		<span class="meta-item">{$t('profile_member_since', { values: { date: new Date(profile.created_at).toLocaleDateString(data.lang) } })}</span>
	</div>
</section>

{#if recipes.length}
	<section class="recipe-grid">
		{#each recipes as recipe}
			<RecipeCard {recipe} lang={data.lang} />
		{/each}
	</section>
{:else}
	<p class="empty">{$t('profile_no_recipes')}</p>
{/if}

<style>
.profile-header { padding: 2rem var(--pad) 1rem; }

h1 {
	font-family: 'Playfair Display', serif;
	font-size: clamp(1.8rem, 4vw, 2.8rem);
	color: var(--text);
	margin-bottom: 0.75rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.edit-alias-btn {
	background: none;
	border: none;
	cursor: pointer;
	font-size: 1rem;
	opacity: 0.5;
	padding: 0 0.25rem;
}
.edit-alias-btn:hover { opacity: 1; }

.alias-edit {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	flex-wrap: wrap;
	margin-bottom: 0.75rem;
}

.alias-input {
	font-size: 1.1rem;
	border: none;
	border-bottom: 2px solid var(--terra);
	background: transparent;
	padding: 0.25rem 0;
	color: var(--text);
	min-width: 200px;
}
.alias-input:focus { outline: none; }

.profile-meta {
	display: flex;
	align-items: center;
	gap: 1rem;
	flex-wrap: wrap;
	color: var(--muted);
	font-size: 0.85rem;
}

.meta-item { color: var(--muted); }

.error { color: #c0392b; font-size: 0.85rem; margin-top: 0.25rem; }

.empty { color: var(--muted); padding: 2rem var(--pad); }

.recipe-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 1.5rem;
	padding: 1rem var(--pad) 3rem;
}
</style>
