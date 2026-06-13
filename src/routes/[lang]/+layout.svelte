<script lang="ts">
	import { t, locale } from 'svelte-i18n';
	import WalletConnect from '$lib/components/WalletConnect.svelte';
	import NotificationBell from '$lib/components/NotificationBell.svelte';

	let { children, data } = $props();
	$effect(() => { locale.set(data.lang); });

	const altLang = $derived(data.lang === 'es' ? 'en' : 'es');
	const profileHandle = $derived(data.user?.address ?? data.user?.username ?? '');
</script>

<svelte:head>
	<html lang={data.lang}></html>
	<link rel="alternate" hreflang={altLang} href="/{altLang}" />
</svelte:head>

<header>
	<nav>
		<a href="/{data.lang}">{$t('nav_home')}</a>
		<a href="/{data.lang}/recipes">{$t('nav_recipes')}</a>
		<a href="/{data.lang}/cultures">{$t('nav_cultures')}</a>
		{#if data.user}
			<a href="/{data.lang}/recipes/new">{$t('nav_publish')}</a>
			<a href="/{data.lang}/profile/{profileHandle}">{$t('nav_profile')}</a>
			<NotificationBell count={data.unread_notifications ?? 0} lang={data.lang} />
			{#if data.user.auth_type !== 'wallet'}
				<form method="POST" action="/api/auth/logout?lang={data.lang}" style="display:inline">
					<button type="submit">{$t('auth_logout')}</button>
				</form>
			{/if}
		{:else}
			<a href="/api/auth/google?lang={data.lang}">{$t('auth_login_google')}</a>
			<span>{$t('auth_or')}</span>
			<a href="/api/auth/github?lang={data.lang}">{$t('auth_login_github')}</a>
		{/if}
		<a href="/{altLang}">{altLang.toUpperCase()}</a>
		<WalletConnect />
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
