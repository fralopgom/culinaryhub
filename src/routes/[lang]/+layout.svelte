<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import WalletConnect from '$lib/components/WalletConnect.svelte';
	import NotificationBell from '$lib/components/NotificationBell.svelte';

	let { children, data } = $props();
	$effect(() => { locale.set(data.lang); });

	const altLang       = $derived(data.lang === 'es' ? 'en' : 'es');
	const profileHandle = $derived(data.user?.address ?? data.user?.username ?? '');
	const isHome        = $derived(
		$page.url.pathname === `/${data.lang}` ||
		$page.url.pathname === `/${data.lang}/`
	);

	let menuOpen = $state(false);
	let scrolled = $state(false);

	function closeMenu() { menuOpen = false; }

	onMount(() => {
		const handler = () => { scrolled = window.scrollY > 60; };
		window.addEventListener('scroll', handler, { passive: true });
		return () => window.removeEventListener('scroll', handler);
	});
</script>

<svelte:head>
	<html lang={data.lang}></html>
	<link rel="alternate" hreflang={altLang} href="/{altLang}" />
</svelte:head>

<header class:transparent={isHome && !scrolled} class:scrolled>
	<nav>
		<a class="brand" href="/{data.lang}" onclick={closeMenu}>
			<span class="brand-icon">🍽</span>
			<span class="brand-name">Culinary Hub</span>
		</a>

		<button class="burger" aria-label="Menu" aria-expanded={menuOpen}
			onclick={() => menuOpen = !menuOpen}>
			<span></span><span></span><span></span>
		</button>

		<div class="links" class:open={menuOpen}>
			<a href="/{data.lang}/recipes" onclick={closeMenu}>{$t('nav_recipes')}</a>
			<a href="/{data.lang}/cultures" onclick={closeMenu}>{$t('nav_cultures')}</a>
			{#if data.user}
				<a href="/{data.lang}/recipes/new" class="link-publish" onclick={closeMenu}>{$t('nav_publish')}</a>
				<a href="/{data.lang}/profile/{profileHandle}" onclick={closeMenu}>{$t('nav_profile')}</a>
				<NotificationBell count={data.unread_notifications ?? 0} lang={data.lang} />
				{#if data.user.auth_type !== 'wallet'}
					<form method="POST" action="/api/auth/logout?lang={data.lang}">
						<button type="submit">{$t('auth_logout')}</button>
					</form>
				{/if}
			{:else}
				<a href="/api/auth/google?lang={data.lang}" class="link-auth" onclick={closeMenu}>{$t('auth_login_google')}</a>
				<span class="sep">{$t('auth_or')}</span>
				<a href="/api/auth/github?lang={data.lang}" class="link-auth" onclick={closeMenu}>{$t('auth_login_github')}</a>
			{/if}
			<a href="/{altLang}" class="lang-switch" onclick={closeMenu}>{altLang.toUpperCase()}</a>
			<WalletConnect user={data.user} />
		</div>
	</nav>
</header>

<main class:home={isHome}>
	{@render children()}
</main>

<footer>
	<span>{$t('footer_license')}</span>
	<span>{$t('footer_suite')}</span>
	<a href="/{data.lang}/admin/log">{$t('footer_admin_log')}</a>
</footer>

<style>
header {
	position: sticky;
	top: 0;
	z-index: 100;
	background: rgba(255,255,255,0.97);
	border-bottom: 1px solid var(--border);
	box-shadow: 0 1px 8px rgba(0,0,0,.06);
	backdrop-filter: blur(8px);
	transition: background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
}

header.transparent {
	background: transparent;
	border-bottom-color: transparent;
	box-shadow: none;
}

nav {
	max-width: var(--max-w);
	margin: 0 auto;
	padding: 0 var(--pad);
	height: var(--nav-h);
	display: flex;
	align-items: center;
	gap: 0.25rem;
}

.brand {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	text-decoration: none;
	margin-right: 1rem;
	flex-shrink: 0;
}
.brand-icon { font-size: 1.25rem; }
.brand-name {
	font-family: var(--font-serif);
	font-weight: 700;
	font-size: 1.05rem;
	color: var(--text);
	white-space: nowrap;
	transition: color 0.35s;
}
header.transparent .brand-name { color: #fff; }

.links {
	display: flex;
	align-items: center;
	gap: 0.1rem;
	flex: 1;
	flex-wrap: wrap;
}

.links a,
.links :global(button) {
	color: var(--text);
	font-size: 0.875rem;
	font-weight: 500;
	padding: 0.4rem 0.7rem;
	border-radius: var(--radius);
	background: none;
	border: none;
	cursor: pointer;
	white-space: nowrap;
	text-decoration: none;
	font-family: var(--font-sans);
	transition: color 0.35s, background 0.2s;
}
.links a:hover,
.links :global(button:hover) { background: var(--accent-light); color: var(--accent); text-decoration: none; }

header.transparent .links a,
header.transparent .links :global(button) { color: rgba(255,255,255,0.9); }
header.transparent .links a:hover,
header.transparent .links :global(button:hover) { background: rgba(255,255,255,0.15); color: #fff; }

.link-publish {
	background: var(--accent-light) !important;
	color: var(--accent) !important;
	font-weight: 600 !important;
}
header.transparent .link-publish {
	background: rgba(255,255,255,0.2) !important;
	color: #fff !important;
}

.lang-switch {
	margin-left: auto;
	font-size: 0.75rem !important;
	font-weight: 600 !important;
	letter-spacing: 0.05em;
	color: var(--muted) !important;
}
.sep { color: var(--muted); font-size: 0.75rem; padding: 0 0.1rem; }
.links form { display: inline; }

/* Hamburger */
.burger {
	display: none;
	margin-left: auto;
	background: none;
	border: none;
	cursor: pointer;
	padding: 0.5rem;
	flex-direction: column;
	gap: 5px;
	flex-shrink: 0;
}
.burger span {
	display: block;
	width: 22px;
	height: 2px;
	background: var(--text);
	border-radius: 2px;
	transition: background 0.35s;
}
header.transparent .burger span { background: #fff; }

/* Mobile */
@media (max-width: 767px) {
	nav { flex-wrap: wrap; height: auto; align-items: stretch; padding-top: 0; padding-bottom: 0; }
	.brand { height: var(--nav-h); display: flex; align-items: center; }
	.burger { display: flex; height: var(--nav-h); align-items: center; }

	.links {
		display: none;
		flex-direction: column;
		align-items: stretch;
		width: 100%;
		padding: 0.5rem 0 1rem;
		gap: 0;
		border-top: 1px solid var(--border);
		background: #fff;
	}
	.links.open { display: flex; }

	.links a,
	.links :global(button) {
		padding: 0.7rem 0.75rem;
		border-radius: 0;
		font-size: 0.95rem;
		border-bottom: 1px solid var(--border);
		color: var(--text) !important;
		background: none !important;
	}
	.links a:hover, .links :global(button:hover) { background: var(--cream) !important; }
	.links form { width: 100%; }
	.links form :global(button) { width: 100%; text-align: left; }
	.sep { display: none; }
	.lang-switch { margin-left: 0; }
}

/* main has no top padding when home (hero handles it) */
:global(main.home) { padding-top: 0; padding-bottom: 0; max-width: 100%; }
</style>
