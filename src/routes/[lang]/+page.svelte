<script lang="ts">
	import { t } from 'svelte-i18n';
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import { HERO_PHOTO } from '$lib/utils/unsplash';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{$t('meta_home_title')}</title>
	<meta name="description" content={$t('meta_home_description')} />
	<meta property="og:title"       content={$t('meta_home_title')} />
	<meta property="og:description" content={$t('meta_home_description')} />
	<meta property="og:image"       content={HERO_PHOTO} />
	<meta property="og:type"        content="website" />
</svelte:head>

<!-- HERO -->
<section class="hero" style="background-image: url('{HERO_PHOTO}')">
	<div class="hero-overlay"></div>
	<div class="hero-content">
		<p class="hero-eyebrow">{$t('footer_suite')}</p>
		<h1>{$t('home_hero_title')}</h1>
		<p class="hero-sub">{$t('home_hero_subtitle')}</p>
		<div class="hero-actions">
			<a href="/{data.lang}/recipes" class="btn-hero-primary">{$t('home_cta_browse')}</a>
			{#if data.user}
				<a href="/{data.lang}/recipes/new" class="btn-hero-secondary">{$t('home_cta_publish')}</a>
			{:else}
				<a href="/api/auth/google?lang={data.lang}" class="btn-hero-secondary">{$t('auth_login_google')}</a>
			{/if}
		</div>
	</div>
	<div class="hero-scroll-hint" aria-hidden="true">
		<span>↓</span>
	</div>
</section>

<!-- RECENT RECIPES -->
{#if data.recipes.length}
<section class="recipes-section">
	<div class="section-inner">
		<div class="section-header">
			<h2>{$t('nav_recipes')}</h2>
			<a href="/{data.lang}/recipes" class="see-all">{$t('home_cta_browse')} →</a>
		</div>
		<div class="grid">
			{#each data.recipes as recipe}
				<RecipeCard {recipe} lang={data.lang} />
			{/each}
		</div>
	</div>
</section>
{/if}

<!-- VALUE PROPS -->
<section class="pillars">
	<div class="section-inner">
		<div class="pillar-grid">
			<div class="pillar">
				<span class="pillar-icon">📖</span>
				<h3>Preserva</h3>
				<p>Guarda recetas familiares antes de que se pierdan para siempre.</p>
			</div>
			<div class="pillar">
				<span class="pillar-icon">🌍</span>
				<h3>Comparte</h3>
				<p>Conecta con personas que comparten tu herencia culinaria.</p>
			</div>
			<div class="pillar">
				<span class="pillar-icon">✍️</span>
				<h3>Certifica</h3>
				<p>Sella la autoría de tu receta con tecnología Sygnet.</p>
			</div>
		</div>
	</div>
</section>

<style>
/* HERO */
.hero {
	position: relative;
	min-height: calc(100dvh - var(--nav-h));
	background-size: cover;
	background-position: center;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	color: #fff;
	overflow: hidden;
}

.hero-overlay {
	position: absolute;
	inset: 0;
	background: linear-gradient(
		160deg,
		rgba(15, 10, 5, 0.55) 0%,
		rgba(20, 12, 5, 0.70) 60%,
		rgba(10, 5, 0, 0.82) 100%
	);
}

.hero-content {
	position: relative;
	z-index: 1;
	max-width: 720px;
	padding: var(--pad);
}

.hero-eyebrow {
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.15em;
	text-transform: uppercase;
	color: rgba(255,255,255,0.6);
	margin-bottom: 1rem;
	margin-top: 0;
}

.hero-content h1 {
	font-size: clamp(2.2rem, 6vw, 3.8rem);
	font-weight: 700;
	line-height: 1.15;
	text-shadow: 0 2px 20px rgba(0,0,0,0.4);
	margin-bottom: 1.25rem;
}

.hero-sub {
	font-size: clamp(1rem, 2.5vw, 1.2rem);
	color: rgba(255,255,255,0.82);
	line-height: 1.6;
	margin-bottom: 2.25rem;
	margin-top: 0;
}

.hero-actions {
	display: flex;
	gap: 1rem;
	justify-content: center;
	flex-wrap: wrap;
}

.btn-hero-primary {
	display: inline-block;
	padding: 0.8rem 2rem;
	background: var(--accent);
	color: #fff;
	border-radius: var(--radius);
	font-weight: 600;
	font-size: 1rem;
	text-decoration: none;
	transition: background 0.2s, transform 0.15s;
	box-shadow: 0 4px 16px rgba(194, 101, 42, 0.45);
}
.btn-hero-primary:hover { background: var(--accent-dark); transform: translateY(-2px); text-decoration: none; color: #fff; }

.btn-hero-secondary {
	display: inline-block;
	padding: 0.8rem 2rem;
	background: rgba(255,255,255,0.12);
	color: #fff;
	border: 1.5px solid rgba(255,255,255,0.4);
	border-radius: var(--radius);
	font-weight: 500;
	font-size: 1rem;
	text-decoration: none;
	backdrop-filter: blur(4px);
	transition: background 0.2s, transform 0.15s;
}
.btn-hero-secondary:hover { background: rgba(255,255,255,0.22); transform: translateY(-2px); text-decoration: none; color: #fff; }

.hero-scroll-hint {
	position: absolute;
	bottom: 2rem;
	left: 50%;
	transform: translateX(-50%);
	z-index: 1;
	color: rgba(255,255,255,0.45);
	font-size: 1.3rem;
	animation: bounce 2s infinite;
}
@keyframes bounce {
	0%, 100% { transform: translateX(-50%) translateY(0); }
	50%       { transform: translateX(-50%) translateY(6px); }
}

/* SECTIONS */
.recipes-section,
.pillars {
	padding: clamp(3rem, 6vw, 5rem) var(--pad);
}

.pillars { background: var(--surface); }

.section-inner { max-width: var(--max-w); margin: 0 auto; }

.section-header {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	margin-bottom: 1.75rem;
	gap: 1rem;
}
.section-header h2 { margin: 0; }

.see-all {
	font-size: 0.875rem;
	font-weight: 500;
	color: var(--accent);
	white-space: nowrap;
}
.see-all:hover { color: var(--accent-dark); }

/* VALUE PROPS */
.pillar-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 2rem;
	margin-top: 0.5rem;
}

.pillar {
	text-align: center;
	padding: 2rem 1.5rem;
	border-radius: var(--radius-lg);
	background: var(--cream);
	border: 1px solid var(--border);
}

.pillar-icon { font-size: 2.2rem; display: block; margin-bottom: 0.75rem; }
.pillar h3 { font-size: 1.1rem; margin-bottom: 0.5rem; }
.pillar p { color: var(--muted); font-size: 0.9rem; margin: 0; line-height: 1.55; }

@media (max-width: 560px) {
	.hero-actions { flex-direction: column; align-items: center; }
	.btn-hero-primary, .btn-hero-secondary { width: 100%; max-width: 280px; text-align: center; }
}
</style>
