<script lang="ts">
	import { t } from 'svelte-i18n';
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import { HERO_PHOTO, recipePhoto } from '$lib/utils/unsplash';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Atmospheric culture cards even without recipes
	const CULTURE_PHOTOS = [
		'1504674900247-0877df9cc836',
		'1455619452474-a2175cc2d3e1',
		'1543339308-43e59d6b73a6',
		'1547592180-85f173990554',
		'1498654896293-37aaa4cdbf28',
		'1484723091739-30b0bd76b342',
	];
	function culturePhoto(i: number) {
		const id = CULTURE_PHOTOS[i % CULTURE_PHOTOS.length];
		return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&h=400&q=75`;
	}

	const topCultures = $derived(
		(data.cultures as any[] ?? [])
			.filter((c: any) => c.level === 0)
			.slice(0, 6)
	);
</script>

<svelte:head>
	<title>{$t('meta_home_title')}</title>
	<meta name="description" content={$t('meta_home_description')} />
	<meta property="og:title"       content={$t('meta_home_title')} />
	<meta property="og:description" content={$t('meta_home_description')} />
	<meta property="og:image"       content={HERO_PHOTO} />
	<meta property="og:type"        content="website" />
</svelte:head>

<!-- ░░ HERO ░░ -->
<section class="hero" style="--hero-img: url('{HERO_PHOTO}')">
	<div class="hero-overlay"></div>
	<div class="hero-content">
		<p class="eyebrow">✦ {$t('footer_suite')}</p>
		<h1>{$t('home_hero_title')}</h1>
		<p class="hero-sub">{$t('home_hero_subtitle')}</p>
		<div class="hero-ctas">
			<a href="/{data.lang}/recipes" class="cta-primary">{$t('home_cta_browse')}</a>
			{#if data.user}
				<a href="/{data.lang}/recipes/new" class="cta-ghost">{$t('home_cta_publish')}</a>
			{:else}
				<a href="/api/auth/google?lang={data.lang}" class="cta-ghost">{$t('auth_login_google')}</a>
			{/if}
		</div>
	</div>
	<span class="scroll-hint" aria-hidden="true">↓</span>
</section>

<!-- ░░ RECENT RECIPES ░░ -->
{#if data.recipes?.length}
<section class="page-section">
	<div class="section-wrap">
		<div class="section-head">
			<h2>{$t('nav_recipes')}</h2>
			<a href="/{data.lang}/recipes" class="see-all">Ver todas →</a>
		</div>
		<div class="grid">
			{#each data.recipes as recipe}
				<RecipeCard {recipe} lang={data.lang} />
			{/each}
		</div>
	</div>
</section>
{/if}

<!-- ░░ CULTURES MOSAIC — always visible ░░ -->
{#if topCultures.length}
<section class="page-section cultures-section">
	<div class="section-wrap">
		<div class="section-head">
			<h2>{$t('nav_cultures')}</h2>
			<a href="/{data.lang}/cultures" class="see-all">Explorar →</a>
		</div>
		<div class="culture-mosaic">
			{#each topCultures as culture, i}
				<a href="/{data.lang}/cultures/{culture.slug}" class="culture-card">
					<img src={culturePhoto(i)} alt={culture.name} loading="lazy" />
					<div class="culture-overlay">
						<span>{culture.name}</span>
					</div>
				</a>
			{/each}
		</div>
	</div>
</section>
{/if}

<!-- ░░ VALUE PROPS ░░ -->
<section class="page-section pillars-section">
	<div class="section-wrap pillars">
		<div class="pillar">
			<span class="pillar-icon">📖</span>
			<h3>Preserva</h3>
			<p>Cada receta es un trozo de historia. Guárdala antes de que se pierda.</p>
		</div>
		<div class="pillar">
			<span class="pillar-icon">🌍</span>
			<h3>Comparte</h3>
			<p>Conecta con personas que cuidan la misma herencia culinaria que tú.</p>
		</div>
		<div class="pillar">
			<span class="pillar-icon">✦</span>
			<h3>Certifica</h3>
			<p>Sella la autoría de tu receta. Que quede constancia de quién la guardó.</p>
		</div>
	</div>
</section>

<style>
/* HERO */
.hero {
	position: relative;
	min-height: calc(100dvh - var(--nav-h));
	background-image: var(--hero-img);
	background-size: cover;
	background-position: center;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	color: #fff;
}

.hero-overlay {
	position: absolute;
	inset: 0;
	background: linear-gradient(
		170deg,
		rgba(44, 30, 18, 0.45) 0%,
		rgba(30, 18, 10, 0.72) 100%
	);
}

.hero-content {
	position: relative;
	z-index: 1;
	max-width: 680px;
	padding: 2rem var(--pad);
}

.eyebrow {
	font-size: 0.7rem;
	font-weight: 700;
	letter-spacing: 0.18em;
	text-transform: uppercase;
	color: rgba(255,255,255,0.55);
	margin-bottom: 1.25rem;
}

.hero-content h1 {
	font-size: clamp(2.4rem, 6vw, 4rem);
	color: #fff;
	text-shadow: 0 2px 24px rgba(0,0,0,0.35);
	margin-bottom: 1rem;
}

.hero-sub {
	font-size: clamp(1rem, 2.2vw, 1.15rem);
	color: rgba(255,255,255,0.78);
	line-height: 1.65;
	margin-bottom: 2.5rem;
}

.hero-ctas { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

.cta-primary {
	padding: 0.8rem 2rem;
	background: var(--terra);
	color: #fff;
	border-radius: var(--radius);
	font-weight: 600;
	font-size: 0.95rem;
	box-shadow: 0 4px 20px rgba(184, 92, 56, 0.5);
	transition: background 0.2s, transform 0.15s;
	text-decoration: none;
}
.cta-primary:hover { background: var(--accent-dark); transform: translateY(-2px); color: #fff; text-decoration: none; }

.cta-ghost {
	padding: 0.8rem 2rem;
	background: rgba(255,255,255,0.1);
	border: 1.5px solid rgba(255,255,255,0.35);
	color: rgba(255,255,255,0.9);
	border-radius: var(--radius);
	font-weight: 500;
	font-size: 0.95rem;
	backdrop-filter: blur(6px);
	transition: background 0.2s, transform 0.15s;
	text-decoration: none;
}
.cta-ghost:hover { background: rgba(255,255,255,0.2); transform: translateY(-2px); color: #fff; text-decoration: none; }

.scroll-hint {
	position: absolute;
	bottom: 2rem;
	left: 50%;
	transform: translateX(-50%);
	z-index: 1;
	color: rgba(255,255,255,0.4);
	font-size: 1.2rem;
	animation: bob 2.2s ease-in-out infinite;
}
@keyframes bob { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(7px)} }

/* SECTIONS */
.page-section { padding: clamp(3rem, 7vw, 6rem) var(--pad); }
.pillars-section { background: var(--surface); }
.cultures-section { background: var(--cream); }
.section-wrap { max-width: var(--max-w); margin: 0 auto; }

.section-head {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	margin-bottom: 2rem;
	gap: 1rem;
}
.section-head h2 { margin: 0; }
.see-all { font-size: 0.85rem; font-weight: 500; color: var(--terra); white-space: nowrap; }
.see-all:hover { color: var(--accent-dark); }

/* CULTURE MOSAIC */
.culture-mosaic {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 1rem;
}
@media (min-width: 640px)  { .culture-mosaic { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 900px)  { .culture-mosaic { grid-template-columns: repeat(6, 1fr); } }

.culture-card {
	position: relative;
	border-radius: var(--radius-lg);
	overflow: hidden;
	aspect-ratio: 4/3;
	display: block;
	text-decoration: none;
}
.culture-card img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	transition: transform 0.5s ease;
}
.culture-card:hover img { transform: scale(1.06); }

.culture-overlay {
	position: absolute;
	inset: 0;
	background: linear-gradient(to top, rgba(20,12,5,0.72) 0%, transparent 55%);
	display: flex;
	align-items: flex-end;
	padding: 0.75rem;
}
.culture-overlay span {
	color: #fff;
	font-family: var(--font-serif);
	font-size: 0.9rem;
	font-weight: 600;
	line-height: 1.2;
	text-shadow: 0 1px 4px rgba(0,0,0,0.4);
}

/* VALUE PROPS */
.pillars {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 3rem;
}
.pillar { text-align: center; }
.pillar-icon { font-size: 2rem; display: block; margin-bottom: 1rem; }
.pillar h3 { margin-bottom: 0.5rem; }
.pillar p { color: var(--muted); font-size: 0.9rem; line-height: 1.65; margin: 0; }

@media (max-width: 480px) {
	.hero-ctas { flex-direction: column; align-items: center; }
	.cta-primary, .cta-ghost { width: 100%; max-width: 260px; text-align: center; }
}
</style>
