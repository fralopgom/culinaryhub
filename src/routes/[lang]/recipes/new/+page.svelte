<script lang="ts">
	import { t } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Ingredient = { ingredient_id: string; quantity: string; unit: string; notes_es: string; notes_en: string };

	let title           = $state('');
	let description     = $state('');
	let instructions    = $state<string[]>(['']);
	let culture_id      = $state('');
	let selectedIngreds = $state<Ingredient[]>([]);
	let tags            = $state('');
	let prep_time_min   = $state('');
	let cook_time_min   = $state('');
	let servings        = $state('');
	let difficulty      = $state('');
	let ai_level        = $state('none');
	let license         = $state(false);
	let submitting      = $state(false);
	let error_msg       = $state('');
	let overlap_count   = $state(0);

	// honeypot — must stay empty
	let website = $state('');

	function addStep() { instructions = [...instructions, '']; }
	function removeStep(i: number) { instructions = instructions.filter((_, idx) => idx !== i); }

	function addIngredient(id: string) {
		if (!id || selectedIngreds.find(i => i.ingredient_id === id)) return;
		selectedIngreds = [...selectedIngreds, { ingredient_id: id, quantity: '', unit: '', notes_es: '', notes_en: '' }];
	}

	function removeIngredient(id: string) {
		selectedIngreds = selectedIngreds.filter(i => i.ingredient_id !== id);
	}

	function ingredientName(id: string) {
		return data.ingredients.find((i: { id: string; name: string }) => i.id === id)?.name ?? id;
	}

	async function submit() {
		if (!title.trim() || !license) return;
		submitting = true;
		error_msg = '';

		const res = await fetch('/api/recipes', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				website,  // honeypot
				title, description,
				instructions: instructions.filter(s => s.trim()),
				culture_id: culture_id || null,
				ingredients: selectedIngreds,
				tags: tags.split(',').map(t => t.trim()).filter(Boolean),
				prep_time_min: prep_time_min ? parseInt(prep_time_min) : null,
				cook_time_min: cook_time_min ? parseInt(cook_time_min) : null,
				servings: servings ? parseInt(servings) : null,
				difficulty: difficulty || null,
				ai_level,
				license_accepted: license
			})
		});

		const body = await res.json();
		if (res.ok) {
			if (body.overlap_count > 0) overlap_count = body.overlap_count;
			goto(`/${data.lang}/recipes/${body.recipe.slug}`);
		} else {
			error_msg = body.message ?? $t('error_server');
		}
		submitting = false;
	}
</script>

<svelte:head>
	<title>{$t('publish_title')} — {$t('meta_site_name')}</title>
</svelte:head>

<h1>{$t('publish_title')}</h1>

<form onsubmit={(e) => { e.preventDefault(); submit(); }}>
	<!-- honeypot: invisible for humans -->
	<input name="website" bind:value={website} style="display:none" tabindex="-1" autocomplete="off" />

	<label>
		<input type="text" bind:value={title} required placeholder="…" />
	</label>

	<label>
		<textarea bind:value={description} rows="3"></textarea>
	</label>

	<select bind:value={culture_id}>
		<option value="">{$t('recipe_culture')}</option>
		{#each data.cultures as c}
			<option value={c.id}>{'—'.repeat(c.level)} {c.name}</option>
		{/each}
	</select>

	<section>
		<h2>{$t('recipe_ingredients')}</h2>
		<select onchange={(e) => { addIngredient((e.target as HTMLSelectElement).value); (e.target as HTMLSelectElement).value = ''; }}>
			<option value="">+ {$t('recipe_ingredients')}</option>
			{#each data.ingredients as ing}
				<option value={ing.id}>{ing.name}</option>
			{/each}
		</select>
		{#each selectedIngreds as ing, i}
			<div class="ing-row">
				<span>{ingredientName(ing.ingredient_id)}</span>
				<input type="text" bind:value={ing.quantity} placeholder="qty" />
				<input type="text" bind:value={ing.unit}     placeholder="unit" />
				<button type="button" onclick={() => removeIngredient(ing.ingredient_id)}>✕</button>
			</div>
		{/each}
	</section>

	<section>
		<h2>{$t('recipe_instructions')}</h2>
		{#each instructions as step, i}
			<div class="step-row">
				<textarea bind:value={instructions[i]} rows="2"></textarea>
				{#if instructions.length > 1}
					<button type="button" onclick={() => removeStep(i)}>✕</button>
				{/if}
			</div>
		{/each}
		<button type="button" onclick={addStep}>+ paso</button>
	</section>

	<input type="text" bind:value={tags} placeholder="tag1, tag2" />

	<div class="row">
		<input type="number" bind:value={prep_time_min} min="0" placeholder="prep min" />
		<input type="number" bind:value={cook_time_min} min="0" placeholder="cook min" />
		<input type="number" bind:value={servings}      min="1" placeholder="servings" />
	</div>

	<select bind:value={difficulty}>
		<option value="">—</option>
		<option value="easy">{$t('recipe_difficulty_easy')}</option>
		<option value="medium">{$t('recipe_difficulty_medium')}</option>
		<option value="hard">{$t('recipe_difficulty_hard')}</option>
	</select>

	<select bind:value={ai_level}>
		<option value="none">{$t('recipe_ai_none')}</option>
		<option value="assisted">{$t('recipe_ai_assisted')}</option>
		<option value="generated">{$t('recipe_ai_generated')}</option>
		<option value="mixed">{$t('recipe_ai_mixed')}</option>
	</select>

	<label class="checkbox-row">
		<input type="checkbox" bind:checked={license} required />
		{$t('recipe_license_accept')}
	</label>

	{#if overlap_count > 0}<p class="warning">{$t('recipe_overlap_warning', { values: { count: overlap_count } })}</p>{/if}
	{#if error_msg}<p class="error">{error_msg}</p>{/if}

	<button type="submit" data-primary disabled={submitting || !license}>
		{submitting ? '…' : $t('publish_submit')}
	</button>
</form>

<style>
h1 { margin-bottom: 1.5rem; }

form {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	max-width: 680px;
}

form section {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	padding: 1rem;
	border: 1px solid var(--border);
	border-radius: var(--radius);
	background: var(--surface);
}

form section h2 { margin: 0 0 0.25rem; font-size: 1rem; }

.row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.row input { flex: 1; min-width: 80px; }

.ing-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.ing-row span { flex: 1; min-width: 100px; font-size: 0.875rem; }
.ing-row input { width: 70px; }
.ing-row button { padding: 0.35rem 0.6rem; color: var(--muted); }

.step-row { display: flex; gap: 0.5rem; align-items: flex-start; }
.step-row textarea { flex: 1; }
.step-row button { margin-top: 0.25rem; padding: 0.35rem 0.6rem; color: var(--muted); }

label.checkbox-row { flex-direction: row; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: var(--text); }

.error { color: #c0392b; font-size: 0.875rem; }
.warning { color: #c2652a; font-size: 0.875rem; }

@media (max-width: 500px) {
	.row { flex-direction: column; }
}
</style>
