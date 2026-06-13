<script lang="ts">
	import { t } from 'svelte-i18n';
	import PrestigeBadge from '$lib/components/PrestigeBadge.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let { recipe, tags, versions } = $derived(data);

	let ratingScore = $state(0);
	let flagReason  = $state('');
	let submitting  = $state(false);
	let message     = $state('');

	const isOwn = $derived(!!data.user && data.user.id === recipe.author_id);

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
		{$t('recipe_by', { values: { author: recipe.author_display_name ?? recipe.author_username } })}
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
			{#each (recipe.free_ingredients ?? []) as ing}
				<li>{ing}</li>
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

	{#if data.user && !isOwn}
		<section class="rating-section">
			<p class="rating-label">{$t('recipe_rate_label')}</p>
			<div class="stars">
				{#each [1,2,3,4,5] as n}
					<button
						class="star"
						class:active={ratingScore >= n}
						onclick={() => ratingScore = n}
						aria-label="★{n}"
					>★</button>
				{/each}
			</div>
			{#if ratingScore > 0}
				<button class="btn-rate" onclick={submitRating} disabled={submitting}>
					{submitting ? '…' : $t('recipe_rate_submit')}
				</button>
			{/if}
			{#if message}<p class="rate-msg">{message}</p>{/if}
		</section>

		<details class="flag-details">
			<summary>⚑ {$t('recipe_flag_label')}</summary>
			<select bind:value={flagReason}>
				<option value="">—</option>
				<option value="plagiarism">{$t('flag_plagiarism')}</option>
				<option value="dangerous">{$t('flag_dangerous')}</option>
				<option value="inappropriate">{$t('flag_inappropriate')}</option>
				<option value="duplicate">{$t('flag_duplicate')}</option>
			</select>
			{#if flagReason}
				<button onclick={submitFlag} disabled={submitting}>⚑ {$t('recipe_flag_submit')}</button>
			{/if}
		</details>
	{/if}
</article>

<style>
.rating-section { margin: 2rem 0 1rem; }
.rating-label   { font-size: 0.85rem; color: var(--muted); margin-bottom: 0.5rem; }

.stars { display: flex; gap: 0.25rem; margin-bottom: 0.75rem; }
.star  {
	font-size: 1.8rem;
	background: none;
	border: none;
	cursor: pointer;
	color: #ccc;
	padding: 0;
	line-height: 1;
	transition: color 0.1s, transform 0.1s;
}
.star:hover,
.star.active { color: #e8a020; }
.star:hover  { transform: scale(1.15); }

.btn-rate {
	padding: 0.4rem 1.2rem;
	background: var(--terra);
	color: #fff;
	border: none;
	border-radius: var(--radius);
	font-size: 0.9rem;
	cursor: pointer;
}
.btn-rate:disabled { opacity: 0.6; cursor: default; }

.rate-msg { font-size: 0.85rem; margin-top: 0.5rem; color: var(--muted); }

.flag-details { margin-top: 1.5rem; font-size: 0.85rem; color: var(--muted); }
</style>
