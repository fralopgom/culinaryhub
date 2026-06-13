<script lang="ts">
	import { t } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Step = 'paste' | 'review';

	let step      = $state<Step>('paste');
	let rawText   = $state('');
	let analyzing = $state(false);
	let saving    = $state(false);
	let errorMsg  = $state('');
	let website   = $state(''); // honeypot

	let editTitle       = $state('');
	let editDescription = $state('');
	let editIngredients = $state<string[]>(['']);
	let editSteps       = $state<string[]>(['']);

	let detailsOpen   = $state(false);
	let culture_id    = $state('');
	let prep_time_min = $state('');
	let cook_time_min = $state('');
	let servings      = $state('');
	let difficulty    = $state('');
	let ai_level      = $state('none');
	let license       = $state(false);
	let photo_url     = $state('');
	let photoOk       = $state(false);

	async function analyze() {
		errorMsg = '';
		if (!rawText.trim()) {
			errorMsg = data.lang === 'en' ? 'Write something to continue' : 'Escribe algo para continuar';
			return;
		}
		analyzing = true;
		try {
			const res = await fetch('/api/recipes/extract', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text: rawText })
			});
			if (!res.ok) {
				errorMsg = `Error ${res.status}`;
				return;
			}
			const d = await res.json();
			editTitle       = d.title       || '';
			editDescription = d.description || '';
			editIngredients = d.ingredients?.length ? d.ingredients : [''];
			editSteps       = d.steps?.length       ? d.steps       : [''];
			step = 'review';
		} catch (e) {
			errorMsg = String(e);
		} finally {
			analyzing = false;
		}
	}

	function addIngredient() { editIngredients = [...editIngredients, '']; }
	function removeIngredient(i: number) { editIngredients = editIngredients.filter((_, j) => j !== i); }
	function addStep()        { editSteps = [...editSteps, '']; }
	function removeStep(i: number)       { editSteps = editSteps.filter((_, j) => j !== i); }

	async function save(status: 'draft' | 'published') {
		if (!editTitle.trim()) { errorMsg = $t('wizard_error_title'); return; }
		const cleanSteps = editSteps.filter((s) => s.trim());
		if (status === 'published' && !cleanSteps.length) { errorMsg = $t('wizard_error_steps'); return; }
		if (status === 'published' && !license)           { errorMsg = $t('wizard_error_license'); return; }

		saving   = true;
		errorMsg = '';
		const res = await fetch('/api/recipes', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				website,
				title:            editTitle.trim(),
				description:      editDescription.trim() || null,
				free_ingredients: editIngredients.filter((s) => s.trim()),
				instructions:     cleanSteps,
				culture_id:       culture_id  || null,
				prep_time_min:    prep_time_min ? parseInt(prep_time_min) : null,
				cook_time_min:    cook_time_min ? parseInt(cook_time_min) : null,
				servings:         servings      ? parseInt(servings)      : null,
				difficulty:       difficulty    || null,
				ai_level,
				photo_url:        photo_url.trim().startsWith('https://') ? photo_url.trim() : null,
				license_accepted: license,
				status
			})
		});
		const body = await res.json();
		if (res.ok) {
			goto(`/${data.lang}/recipes/${body.recipe.slug}`);
		} else {
			errorMsg = body.message ?? $t('error_server');
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>{$t('publish_title')} — {$t('meta_site_name')}</title>
</svelte:head>

<input name="website" bind:value={website} style="display:none" tabindex="-1" autocomplete="off" />

{#if step === 'paste'}
<!-- ── PEGAR ─────────────────────────────────────────────── -->
<div class="paste-screen">
	<header class="paste-header">
		<p class="eyebrow">✦ {$t('publish_title')}</p>
		<h1>{$t('wizard_paste_title')}</h1>
		<p class="subtitle">{$t('wizard_paste_subtitle')}</p>
	</header>

	<textarea
		class="paste-area"
		bind:value={rawText}
		placeholder={$t('wizard_paste_placeholder')}
		rows="14"
	></textarea>

	{#if errorMsg}<p class="msg-err">{errorMsg}</p>{/if}

	<div class="paste-actions">
		<button class="btn btn-primary analyze-btn" onclick={analyze} disabled={analyzing}>
			{analyzing ? $t('wizard_analyzing') : $t('wizard_analyze')}
		</button>
		<a href="/{data.lang}" class="btn btn-ghost">{$t('wizard_cancel')}</a>
	</div>
</div>

{:else}
<!-- ── REVISAR ───────────────────────────────────────────── -->
<div class="review-screen">
	<div class="review-body">
		<button class="back-link" onclick={() => { step = 'paste'; errorMsg = ''; }}>
			← {$t('wizard_back_to_paste')}
		</button>

		<div class="field title-field">
			<label for="edit-title">{$t('wizard_title_label')}</label>
			<input id="edit-title" type="text" bind:value={editTitle}
				class="title-input" placeholder={$t('wizard_title_placeholder')} />
		</div>

		<!-- Ingredientes -->
		<div class="section-divider">{$t('wizard_ingredients_label')}</div>
		<div class="ing-list">
			{#each editIngredients as _, i}
			<div class="ing-row">
				<input type="text" bind:value={editIngredients[i]}
					placeholder="ej. 2 tazas de harina" />
				{#if editIngredients.length > 1}
				<button type="button" class="row-del" onclick={() => removeIngredient(i)} aria-label="Eliminar">×</button>
				{/if}
			</div>
			{/each}
		</div>
		<button type="button" class="btn add-row-btn" onclick={addIngredient}>
			+ {$t('wizard_add_ingredient')}
		</button>

		<!-- Pasos -->
		<div class="section-divider">{$t('wizard_steps_label')}</div>
		<div class="steps-list">
			{#each editSteps as _, i}
			<div class="step-row">
				<span class="step-num">{i + 1}</span>
				<div class="step-field">
					<textarea bind:value={editSteps[i]} rows="2"
						placeholder={$t('wizard_step_placeholder')}></textarea>
					{#if editSteps.length > 1}
					<button type="button" class="row-del step-del" onclick={() => removeStep(i)} aria-label="Eliminar paso">×</button>
					{/if}
				</div>
			</div>
			{/each}
		</div>
		<button type="button" class="btn add-row-btn" onclick={addStep}>
			+ {$t('wizard_add_step')}
		</button>

		<!-- Detalles opcionales -->
		<button type="button" class="details-toggle"
			onclick={() => detailsOpen = !detailsOpen}>
			{detailsOpen ? '▾' : '▸'} {$t('wizard_details_toggle')}
		</button>

		{#if detailsOpen}
		<div class="details-panel">
			<div class="field">
				<label for="culture">{$t('wizard_culture_label')}</label>
				<select id="culture" bind:value={culture_id}>
					<option value="">—</option>
					{#each data.cultures as c}
					<option value={c.id}>{'—'.repeat(c.level)} {c.name}</option>
					{/each}
				</select>
			</div>

			<div class="details-grid">
				<div class="field">
					<label for="prep">{$t('wizard_prep_label')}</label>
					<input id="prep" type="number" bind:value={prep_time_min} min="0" placeholder="30" />
				</div>
				<div class="field">
					<label for="cook">{$t('wizard_cook_label')}</label>
					<input id="cook" type="number" bind:value={cook_time_min} min="0" placeholder="45" />
				</div>
				<div class="field">
					<label for="srv">{$t('wizard_servings_label')}</label>
					<input id="srv" type="number" bind:value={servings} min="1" placeholder="4" />
				</div>
			</div>

			<div class="field">
				<label for="diff">{$t('wizard_difficulty_label')}</label>
				<select id="diff" bind:value={difficulty}>
					<option value="">—</option>
					<option value="easy">{$t('recipe_difficulty_easy')}</option>
					<option value="medium">{$t('recipe_difficulty_medium')}</option>
					<option value="hard">{$t('recipe_difficulty_hard')}</option>
				</select>
			</div>

			<div class="field">
				<label for="ai">{$t('wizard_ai_label')}</label>
				<select id="ai" bind:value={ai_level}>
					<option value="none">{$t('wizard_ai_none')}</option>
					<option value="assisted">{$t('wizard_ai_assisted')}</option>
					<option value="generated">{$t('wizard_ai_generated')}</option>
					<option value="mixed">{$t('wizard_ai_mixed')}</option>
				</select>
			</div>
		</div>
		{/if}

		<!-- Foto -->
		<div class="field photo-field">
			<label for="photo">{$t('wizard_photo_label')}</label>
			<input
				id="photo"
				type="url"
				bind:value={photo_url}
				placeholder="https://i.imgur.com/tu-foto.jpg"
				oninput={() => photoOk = false}
			/>
			<p class="photo-hint">{$t('wizard_photo_hint')}</p>
			{#if photo_url.startsWith('https://')}
				<img
					class="photo-preview"
					src={photo_url}
					alt="preview"
					onload={() => photoOk = true}
					onerror={() => photoOk = false}
				/>
				{#if photoOk}
					<p class="photo-ok">✓ {$t('wizard_photo_ok')}</p>
				{:else}
					<p class="photo-warn">⚠ {$t('wizard_photo_warn')}</p>
				{/if}
			{/if}
		</div>

		<label class="checkbox-label license-check">
			<input type="checkbox" bind:checked={license} />
			<span>{$t('wizard_license_text')}</span>
		</label>

		{#if errorMsg}<p class="msg-err error-inline">{errorMsg}</p>{/if}
	</div>

	<div class="sticky-bar">
		<button class="btn draft-btn" onclick={() => save('draft')} disabled={saving}>
			{$t('wizard_save_draft')}
		</button>
		<button class="btn btn-primary publish-btn" onclick={() => save('published')} disabled={saving}>
			{saving ? '…' : $t('wizard_publish')}
		</button>
	</div>
</div>
{/if}

<style>
/* ── PASTE ─────────────────────────────────────────── */
.paste-screen {
	max-width: 660px;
	margin: 0 auto;
	padding: clamp(2rem, 5vw, 4rem) var(--pad);
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
}
.eyebrow {
	font-size: 0.7rem;
	font-weight: 700;
	letter-spacing: 0.15em;
	text-transform: uppercase;
	color: var(--terra);
	margin-bottom: 0.4rem;
}
.paste-header h1 { font-size: clamp(1.8rem, 4vw, 2.4rem); margin-bottom: 0.5rem; }
.subtitle { color: var(--muted); font-size: 0.95rem; margin: 0; }

.paste-area {
	width: 100%;
	min-height: 240px;
	border: 1.5px solid var(--border);
	border-radius: var(--radius-lg);
	padding: 1.25rem;
	font-family: var(--font-sans);
	font-size: 0.95rem;
	line-height: 1.75;
	color: var(--text);
	background: var(--surface);
	resize: vertical;
	transition: border-color 0.2s;
}
.paste-area:focus { outline: none; border-color: var(--terra); }

.paste-actions { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
.analyze-btn {
	padding: 0.85rem 2rem;
	font-size: 1rem;
	box-shadow: 0 4px 16px rgba(184,92,56,0.3);
}
.analyze-btn:not(:disabled):hover { transform: translateY(-1px); }

/* ── REVIEW ────────────────────────────────────────── */
.review-screen {
	max-width: 660px;
	margin: 0 auto;
	padding-bottom: 90px;
}
.review-body {
	padding: clamp(1.5rem, 4vw, 3rem) var(--pad) 2rem;
	display: flex;
	flex-direction: column;
}
.back-link {
	background: none;
	border: none;
	color: var(--muted);
	font-size: 0.875rem;
	cursor: pointer;
	padding: 0;
	margin-bottom: 1.75rem;
	align-self: flex-start;
}
.back-link:hover { color: var(--terra); }

/* Title */
.title-field { margin-bottom: 1.5rem; }
.title-input {
	font-family: var(--font-serif);
	font-size: clamp(1.4rem, 3vw, 1.9rem);
	font-weight: 700;
	color: var(--text);
	width: 100%;
	border: none;
	border-bottom: 2px solid var(--border);
	background: transparent;
	padding: 0.3rem 0;
	transition: border-color 0.2s;
}
.title-input:focus { outline: none; border-bottom-color: var(--terra); }
.title-input::placeholder { color: var(--subtle); font-weight: 400; font-style: italic; }

/* Ingredients */
.ing-list { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.75rem; }
.ing-row { display: flex; align-items: center; gap: 0.5rem; }
.ing-row input {
	flex: 1;
	padding: 0.55rem 0;
	border: none;
	border-bottom: 1px solid var(--border);
	border-radius: 0;
	background: transparent;
	font-size: 0.95rem;
	color: var(--text);
}
.ing-row input:focus { outline: none; border-bottom-color: var(--terra); }
.ing-row input::placeholder { color: var(--subtle); font-style: italic; }

/* Steps */
.steps-list { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 0.75rem; }
.step-row { display: flex; gap: 0.75rem; align-items: flex-start; }
.step-num {
	width: 1.75rem;
	height: 1.75rem;
	flex-shrink: 0;
	border-radius: 50%;
	border: 1.5px solid var(--border);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 0.75rem;
	font-weight: 700;
	color: var(--muted);
	margin-top: 0.5rem;
}
.step-field { flex: 1; position: relative; }
.step-field textarea {
	width: 100%;
	min-height: 56px;
	padding: 0.5rem 2rem 0.5rem 0;
	border: none;
	border-bottom: 1px solid var(--border);
	border-radius: 0;
	background: transparent;
	font-size: 0.95rem;
	color: var(--text);
	resize: vertical;
}
.step-field textarea:focus { outline: none; border-bottom-color: var(--terra); }
.step-field textarea::placeholder { color: var(--subtle); font-style: italic; }

/* Delete buttons */
.row-del {
	background: none;
	border: none;
	color: var(--subtle);
	font-size: 1.1rem;
	cursor: pointer;
	padding: 0.2rem 0.4rem;
	flex-shrink: 0;
	line-height: 1;
	transition: color 0.15s;
}
.row-del:hover { color: var(--terra); }
.step-del { position: absolute; top: 0.3rem; right: 0; }

.add-row-btn {
	align-self: flex-start;
	border-style: dashed;
	color: var(--muted);
	font-size: 0.875rem;
	padding: 0.45rem 1rem;
	margin-bottom: 1.75rem;
}
.add-row-btn:hover { border-color: var(--terra); color: var(--terra); background: var(--terra-light); }

/* Details */
.details-toggle {
	background: none;
	border: none;
	color: var(--muted);
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	padding: 0.5rem 0;
	margin-bottom: 0.75rem;
	align-self: flex-start;
	letter-spacing: 0.02em;
	transition: color 0.15s;
}
.details-toggle:hover { color: var(--terra); }

.details-panel {
	background: var(--cream);
	border: 1px solid var(--border);
	border-radius: var(--radius-lg);
	padding: 1.5rem;
	margin-bottom: 1.5rem;
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
}
.details-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 1.25rem;
}

.license-check { margin-top: 1.25rem; margin-bottom: 0.5rem; }

.photo-field { margin-top: 1rem; }
.photo-hint { font-size: 0.78rem; color: var(--muted); margin: 0.25rem 0 0.5rem; line-height: 1.4; }
.photo-preview { width: 100%; max-height: 220px; object-fit: cover; border-radius: 6px; margin-top: 0.5rem; }
.photo-ok   { font-size: 0.8rem; color: #2e7d32; margin-top: 0.25rem; }
.photo-warn { font-size: 0.8rem; color: #b85c00; margin-top: 0.25rem; }
.error-inline  { margin-top: 0.5rem; }

/* Sticky bar */
.sticky-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: rgba(255,255,255,0.97);
	backdrop-filter: blur(8px);
	border-top: 1px solid var(--border);
	padding: 0.875rem var(--pad);
	display: flex;
	gap: 0.75rem;
	justify-content: flex-end;
	z-index: 50;
}
.draft-btn { color: var(--muted); }
.draft-btn:hover { background: var(--cream); color: var(--text); }
.publish-btn {
	padding: 0.75rem 2rem;
	box-shadow: 0 4px 14px rgba(184,92,56,0.3);
}
.publish-btn:not(:disabled):hover { transform: translateY(-1px); }

@media (max-width: 560px) {
	.details-grid { grid-template-columns: 1fr 1fr; }
	.sticky-bar   { justify-content: stretch; }
	.draft-btn,
	.publish-btn  { flex: 1; justify-content: center; }
}
</style>
