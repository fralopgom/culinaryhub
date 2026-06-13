<script lang="ts">
	import { t } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { FORM_PHOTOS } from '$lib/utils/unsplash';
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
	let website         = $state(''); // honeypot

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
				website,
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
		if (res.ok) goto(`/${data.lang}/recipes/${body.recipe.slug}`);
		else error_msg = body.message ?? $t('error_server');
		submitting = false;
	}
</script>

<svelte:head>
	<title>{$t('publish_title')} — {$t('meta_site_name')}</title>
</svelte:head>

<!-- honeypot -->
<input name="website" bind:value={website} style="display:none" tabindex="-1" autocomplete="off" />

<div class="wizard">

	<!-- Sidebar image — desktop only -->
	<aside class="sidebar">
		<div class="sidebar-img-wrap">
			<img src={FORM_PHOTOS.soul} alt="" aria-hidden="true" loading="lazy" />
			<div class="sidebar-overlay">
				<blockquote>
					"Cada receta es una carta de amor<br>a quienes vendrán después."
				</blockquote>
			</div>
		</div>
	</aside>

	<!-- Form -->
	<form class="form-body" onsubmit={(e) => { e.preventDefault(); submit(); }}>

		<header class="form-header">
			<p class="form-eyebrow">✦ Nueva receta</p>
			<h1>{$t('publish_title')}</h1>
			<p class="form-intro">Tómate tu tiempo. Esta receta merece ser contada bien.</p>
		</header>

		<!-- ── SECCIÓN 1: EL ALMA ── -->
		<div class="section-divider">El alma del plato</div>

		<div class="field">
			<label for="title">¿Cómo se llama?</label>
			<input id="title" type="text" bind:value={title} required
				placeholder="El nombre que le pone tu familia…" />
		</div>

		<div class="field">
			<label for="desc">Su historia</label>
			<textarea id="desc" bind:value={description} rows="4"
				placeholder="De dónde viene este plato, quién te lo enseñó, qué recuerdos trae a la mesa…"></textarea>
		</div>

		<div class="field">
			<label for="culture">Tradición culinaria</label>
			<select id="culture" bind:value={culture_id}>
				<option value="">Sin asignar</option>
				{#each data.cultures as c}
					<option value={c.id}>{'—'.repeat(c.level)} {c.name}</option>
				{/each}
			</select>
		</div>

		<div class="field">
			<label for="tags">¿Cómo la describirías a un amigo?</label>
			<input id="tags" type="text" bind:value={tags}
				placeholder="tradición, domingo, abuela, mariscos, sin gluten…" />
			<p class="field-hint">Separadas por comas.</p>
		</div>

		<!-- ── SECCIÓN 2: INGREDIENTES ── -->
		<div class="section-divider">Los ingredientes</div>

		<p class="section-intro-text">
			Añádelos como si se los dictaras a un amigo que nunca ha cocinado este plato.
		</p>

		<div class="field">
			<label for="ing-picker">Añadir ingrediente</label>
			<select id="ing-picker"
				onchange={(e) => {
					addIngredient((e.target as HTMLSelectElement).value);
					(e.target as HTMLSelectElement).value = '';
				}}>
				<option value="">Busca un ingrediente…</option>
				{#each data.ingredients as ing}
					<option value={ing.id}>{ing.name}</option>
				{/each}
			</select>
		</div>

		{#if selectedIngreds.length}
		<div class="ingredient-list">
			{#each selectedIngreds as ing}
			<div class="ing-row">
				<span class="ing-name">{ingredientName(ing.ingredient_id)}</span>
				<input type="text" bind:value={ing.quantity} placeholder="Cantidad" class="ing-qty" />
				<input type="text" bind:value={ing.unit}     placeholder="Unidad"   class="ing-unit" />
				<button type="button" class="btn btn-ghost ing-remove"
					onclick={() => removeIngredient(ing.ingredient_id)}
					aria-label="Eliminar">×</button>
			</div>
			{/each}
		</div>
		{/if}

		<!-- ── SECCIÓN 3: PREPARACIÓN ── -->
		<div class="section-divider">La preparación</div>

		<p class="section-intro-text">
			Cuéntanos cómo se hace, paso a paso, con la calma de quien lo ha hecho mil veces.
		</p>

		<div class="steps-list">
			{#each instructions as step, i}
			<div class="step-row">
				<span class="step-num">{i + 1}</span>
				<div class="step-field">
					<textarea bind:value={instructions[i]} rows="2"
						placeholder="Describe este paso…"></textarea>
					{#if instructions.length > 1}
					<button type="button" class="btn btn-ghost step-remove"
						onclick={() => removeStep(i)} aria-label="Eliminar paso">×</button>
					{/if}
				</div>
			</div>
			{/each}
		</div>

		<button type="button" class="btn add-step-btn" onclick={addStep}>
			+ Añadir un paso más
		</button>

		<!-- ── SECCIÓN 4: DETALLES ── -->
		<div class="section-divider">Los detalles</div>

		<div class="details-grid">
			<div class="field">
				<label for="prep">Preparación <span class="unit-hint">(minutos)</span></label>
				<input id="prep" type="number" bind:value={prep_time_min} min="0" placeholder="30" />
			</div>
			<div class="field">
				<label for="cook">Cocción <span class="unit-hint">(minutos)</span></label>
				<input id="cook" type="number" bind:value={cook_time_min} min="0" placeholder="45" />
			</div>
			<div class="field">
				<label for="servings">Raciones</label>
				<input id="servings" type="number" bind:value={servings} min="1" placeholder="4" />
			</div>
		</div>

		<div class="details-row">
			<div class="field">
				<label for="diff">¿Cuánta paciencia requiere?</label>
				<select id="diff" bind:value={difficulty}>
					<option value="">Sin especificar</option>
					<option value="easy">{$t('recipe_difficulty_easy')}</option>
					<option value="medium">{$t('recipe_difficulty_medium')}</option>
					<option value="hard">{$t('recipe_difficulty_hard')}</option>
				</select>
			</div>
			<div class="field">
				<label for="ai">¿Te ha ayudado la inteligencia artificial?</label>
				<select id="ai" bind:value={ai_level}>
					<option value="none">No, es completamente mía</option>
					<option value="assisted">Me ayudó a redactar o traducir</option>
					<option value="generated">La generó una IA, yo la he validado</option>
					<option value="mixed">Una mezcla de las dos</option>
				</select>
			</div>
		</div>

		<!-- ── FIRMA ── -->
		<div class="section-divider">Tu firma</div>

		<label class="checkbox-label field">
			<input type="checkbox" bind:checked={license} required />
			<span>
				Esta receta es un legado abierto. La comparto bajo licencia
				<strong>CC BY-SA 4.0</strong> para que otros puedan preservarla y construir sobre ella.
			</span>
		</label>

		{#if error_msg}
			<p class="msg-err field">{error_msg}</p>
		{/if}

		<div class="submit-row">
			<button type="submit" class="btn btn-primary submit-btn"
				disabled={submitting || !license || !title.trim()}>
				{submitting ? 'Guardando…' : 'Guardar esta receta'}
			</button>
			<a href="/{data.lang}" class="btn btn-ghost">Cancelar</a>
		</div>

	</form>
</div>

<style>
/* LAYOUT */
.wizard {
	display: grid;
	grid-template-columns: 340px 1fr;
	min-height: calc(100dvh - var(--nav-h));
	gap: 0;
}

/* SIDEBAR */
.sidebar {
	position: sticky;
	top: var(--nav-h);
	height: calc(100dvh - var(--nav-h));
	overflow: hidden;
}
.sidebar-img-wrap { position: relative; width: 100%; height: 100%; }
.sidebar-img-wrap img { width: 100%; height: 100%; object-fit: cover; }
.sidebar-overlay {
	position: absolute;
	inset: 0;
	background: linear-gradient(to top, rgba(20,12,5,0.8) 0%, rgba(20,12,5,0.15) 60%);
	display: flex;
	align-items: flex-end;
	padding: 2.5rem;
}
blockquote {
	font-family: var(--font-serif);
	font-style: italic;
	font-size: 1.05rem;
	color: rgba(255,255,255,0.88);
	line-height: 1.65;
	border: none;
}

/* FORM */
.form-body {
	padding: clamp(2rem, 5vw, 4rem) clamp(1.5rem, 5vw, 4rem);
	max-width: 680px;
	display: flex;
	flex-direction: column;
}

.form-header { margin-bottom: 3rem; }
.form-eyebrow {
	font-size: 0.7rem;
	font-weight: 700;
	letter-spacing: 0.15em;
	text-transform: uppercase;
	color: var(--terra);
	margin-bottom: 0.6rem;
}
.form-header h1 { font-size: clamp(1.8rem, 4vw, 2.4rem); margin-bottom: 0.5rem; }
.form-intro { color: var(--muted); font-size: 0.95rem; margin: 0; }

.section-intro-text {
	color: var(--muted);
	font-size: 0.9rem;
	font-style: italic;
	margin-bottom: 1.5rem;
	margin-top: -0.5rem;
}

/* INGREDIENTS */
.ingredient-list {
	display: flex;
	flex-direction: column;
	gap: 0;
	margin-bottom: 1rem;
	border: 1px solid var(--border);
	border-radius: var(--radius);
	overflow: hidden;
	background: var(--surface);
}
.ing-row {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.65rem 1rem;
	border-bottom: 1px solid var(--border);
}
.ing-row:last-child { border-bottom: none; }
.ing-name { flex: 1; font-size: 0.9rem; color: var(--text); min-width: 0; }
.ing-qty, .ing-unit { width: 70px; font-size: 0.875rem; border-bottom: none; border: 1px solid var(--border); border-radius: var(--radius); padding: 0.3rem 0.5rem; background: var(--cream); }
.ing-qty:focus, .ing-unit:focus { border-color: var(--terra); box-shadow: none; }
.ing-remove { padding: 0.25rem 0.5rem; font-size: 1.1rem; color: var(--subtle) !important; }
.ing-remove:hover { color: var(--terra) !important; }

/* STEPS */
.steps-list { display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 1rem; }
.step-row { display: flex; gap: 1rem; align-items: flex-start; }
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
.step-field textarea { padding-bottom: 0; }
.step-remove {
	position: absolute;
	top: 0.25rem;
	right: 0;
	padding: 0.2rem 0.4rem;
	font-size: 1rem;
	color: var(--subtle) !important;
}
.step-remove:hover { color: var(--terra) !important; }

.add-step-btn {
	align-self: flex-start;
	border-style: dashed;
	color: var(--muted);
	font-size: 0.875rem;
	padding: 0.5rem 1rem;
	margin-bottom: 0.5rem;
}
.add-step-btn:hover { border-color: var(--terra); color: var(--terra); background: var(--terra-light); }

/* DETAILS */
.details-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 1.5rem;
}
.details-row {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1.5rem;
	margin-top: 0.5rem;
}

.unit-hint { font-weight: 400; text-transform: none; letter-spacing: 0; font-size: 0.7rem; }

/* SUBMIT */
.submit-row {
	display: flex;
	gap: 1rem;
	align-items: center;
	margin-top: 1rem;
	flex-wrap: wrap;
}
.submit-btn {
	padding: 0.85rem 2.5rem;
	font-size: 1rem;
	letter-spacing: 0.02em;
	box-shadow: 0 4px 16px rgba(184,92,56,0.3);
}
.submit-btn:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(184,92,56,0.4); }

/* RESPONSIVE */
@media (max-width: 900px) {
	.wizard { grid-template-columns: 1fr; }
	.sidebar { display: none; }
	.form-body { max-width: 100%; padding: 2rem var(--pad); }
}
@media (max-width: 560px) {
	.details-grid { grid-template-columns: 1fr 1fr; }
	.details-row  { grid-template-columns: 1fr; }
}
@media (max-width: 400px) {
	.details-grid { grid-template-columns: 1fr; }
}
</style>
