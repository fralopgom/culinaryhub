<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import WalletConnect from '$lib/components/WalletConnect.svelte';
	import NotificationBell from '$lib/components/NotificationBell.svelte';

	let { children, data } = $props();
	$effect(() => { locale.set(data.lang); });

	const altLang = $derived(data.lang === 'es' ? 'en' : 'es');
	const profileHandle = $derived(data.user?.address ?? data.user?.username ?? '');

	let menuOpen = $state(false);
	function closeMenu() { menuOpen = false; }
</script>

<svelte:head>
	<html lang={data.lang}></html>
	<link rel="alternate" hreflang={altLang} href="/{altLang}" />
</svelte:head>

<header>
	<nav>
		<a class="brand" href="/{data.lang}" onclick={closeMenu}>🍽 Culinary Hub</a>

		<button class="burger" aria-label="Menu" aria-expanded={menuOpen}
			onclick={() => menuOpen = !menuOpen}>
			<span></span><span></span><span></span>
		</button>

		<div class="links" class:open={menuOpen}>
			<a href="/{data.lang}/recipes" onclick={closeMenu}>{$t('nav_recipes')}</a>
			<a href="/{data.lang}/cultures" onclick={closeMenu}>{$t('nav_cultures')}</a>
			{#if data.user}
				<a href="/{data.lang}/recipes/new" onclick={closeMenu}>{$t('nav_publish')}</a>
				<a href="/{data.lang}/profile/{profileHandle}" onclick={closeMenu}>{$t('nav_profile')}</a>
				<NotificationBell count={data.unread_notifications ?? 0} lang={data.lang} />
				{#if data.user.auth_type !== 'wallet'}
					<form method="POST" action="/api/auth/logout?lang={data.lang}">
						<button type="submit">{$t('auth_logout')}</button>
					</form>
				{/if}
			{:else}
				<a href="/api/auth/google?lang={data.lang}" onclick={closeMenu}>{$t('auth_login_google')}</a>
				<span class="sep">{$t('auth_or')}</span>
				<a href="/api/auth/github?lang={data.lang}" onclick={closeMenu}>{$t('auth_login_github')}</a>
			{/if}
			<a href="/{altLang}" onclick={closeMenu}>{altLang.toUpperCase()}</a>
			<WalletConnect user={data.user} />
		</div>
	</nav>
</header>

<main>
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
	background: #fff;
	border-bottom: 1px solid var(--border);
	box-shadow: 0 1px 4px rgba(0,0,0,.06);
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
	font-weight: 700;
	font-size: 1rem;
	color: var(--text);
	text-decoration: none;
	white-space: nowrap;
	margin-right: 0.5rem;
}
.brand:hover { color: var(--accent); text-decoration: none; }

.links {
	display: flex;
	align-items: center;
	gap: 0.15rem;
	flex: 1;
	flex-wrap: wrap;
}

.links a,
.links :global(button) {
	color: var(--text);
	font-size: 0.875rem;
	padding: 0.4rem 0.65rem;
	border-radius: var(--radius);
	background: none;
	border: none;
	cursor: pointer;
	white-space: nowrap;
	text-decoration: none;
	font-family: inherit;
}
.links a:hover,
.links :global(button:hover) { background: var(--bg); color: var(--accent); text-decoration: none; }

.links form { display: inline; }
.sep { color: var(--muted); font-size: 0.8rem; padding: 0 0.2rem; }

/* Hamburger button */
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
	transition: all 0.2s;
}

/* Mobile nav */
@media (max-width: 767px) {
	nav {
		flex-wrap: wrap;
		height: auto;
		padding-top: 0;
		padding-bottom: 0;
		align-items: stretch;
	}

	.brand {
		height: var(--nav-h);
		display: flex;
		align-items: center;
	}

	.burger {
		display: flex;
		height: var(--nav-h);
		align-items: center;
	}

	.links {
		display: none;
		flex-direction: column;
		align-items: stretch;
		width: 100%;
		padding: 0.5rem 0 1rem;
		gap: 0;
		border-top: 1px solid var(--border);
	}
	.links.open { display: flex; }

	.links a,
	.links :global(button) {
		padding: 0.65rem 0.5rem;
		border-radius: 0;
		font-size: 0.95rem;
		border-bottom: 1px solid var(--border);
	}

	.links form { width: 100%; }
	.links form :global(button) { width: 100%; text-align: left; }

	.sep { display: none; }
}
</style>
