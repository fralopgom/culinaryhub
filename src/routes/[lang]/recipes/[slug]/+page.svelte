<script lang="ts">
	import { t } from 'svelte-i18n';
	import PrestigeBadge from '$lib/components/PrestigeBadge.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let { recipe, ingredients, tags, versions } = $derived(data);

	let ratingScore = $state(0);
	let flagReason  = $state('');
	let submitting  = $state(false);
	let message     = $state('');

	async function submitRating() {
		submitting = true;
		const res = await fetch('/api/ratings', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ recipe_id: recipe.id, score: ratingScore })
		});
		message = res.ok ? '✓' : (await res.json()).message;
		submitting = false;
	}

	async function submitFlag() {
		submitting = true;
		const res = await fetch('/api/flags', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ recipe_id: recipe.id, reason: flagReason })
		});
		message = res.ok ? '✓' : (await res.json()).message;
		submitting = false;
	}
</script>

<svelte:head>
	<title>{recipe.title} — {$t('meta_site_name')}</title>
	<meta name="description" content={recipe.description ?? ''} />
	<meta property="og:title"       content={recipe.title} />
	<meta property="og:description" content={recipe.description ?? ''} />
	<meta property="og:type"        content="article" />
	<link rel="canonical" href="/{data.lang}/recipes/{recipe.slug}" />
</svelte:head>

<article>
	<h1>{recipe.title}</h1>

	<p>
		{$t('recipe_by', { values: { author: recipe.author_username } })}
		· <PrestigeBadge score={recipe.author_prestige} />
		{#if recipe.culture_name}
			· <a href="/{data.lang}/cultures/{recipe.culture_slug}">{recipe.culture_name}</a>
		{/if}
		· ★ {recipe.avg_score} ({recipe.rating_count})
	</p>

	{#if recipe.sygnet_cert_id}
		<p>{$t('recipe_certified')}</p>
	{/if}

	<p>{$t('recipe_version', { values: { n: recipe.version } })}</p>

	{#if recipe.description}
		<p>{recipe.description}</p>
	{/if}

	<section>
		<h2>{$t('recipe_ingredients')}</h2>
		<ul>
			{#each ingredients as ing}
				<li>
					{#if ing.quantity}{ing.quantity}{/if}
					{#if ing.unit}{ing.unit}{/if}
					{ing.name}
					{#if data.lang === 'es' && ing.notes_es} — {ing.notes_es}{/if}
					{#if data.lang === 'en' && ing.notes_en} — {ing.notes_en}{/if}
				</li>
			{/each}
		</ul>
	</section>

	<section>
		<h2>{$t('recipe_instructions')}</h2>
		<ol>
			{#each recipe.instructions as step}
				<li>{typeof step === 'string' ? step : step.text}</li>
			{/each}
		</ol>
	</section>

	{#if tags.length}
		<p>{#each tags as tag}<a href="/{data.lang}/recipes?tag={tag}">#{tag}</a> {/each}</p>
	{/if}

	<p>{$t('recipe_license')}</p>

	{#if versions.length > 1}
		<details>
			<summary>{$t('recipe_version', { values: { n: '' } })}</summary>
			<ul>
				{#each versions as v}
					<li>v{v.version} — {new Date(v.created_at).toLocaleDateString(data.lang)}
						{#if v.sygnet_cert_id} ✓{/if}
					</li>
				{/each}
			</ul>
		</details>
	{/if}

	{#if data.user}
		<section>
			{#each [1,2,3,4,5] as n}
				<button onclick={() => ratingScore = n} aria-pressed={ratingScore === n}>★{n}</button>
			{/each}
			{#if ratingScore > 0}
				<button onclick={submitRating} disabled={submitting}>✓</button>
			{/if}
		</section>

		<details>
			<summary>⚑ Flag</summary>
			<select bind:value={flagReason}>
				<option value="">—</option>
				<option value="plagiarism">plagiarism</option>
				<option value="dangerous">dangerous</option>
				<option value="inappropriate">inappropriate</option>
				<option value="duplicate">duplicate</option>
			</select>
			{#if flagReason}
				<button onclick={submitFlag} disabled={submitting}>⚑</button>
			{/if}
		</details>

		{#if message}<p>{message}</p>{/if}
	{/if}
</article>
