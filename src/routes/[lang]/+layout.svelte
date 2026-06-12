<script lang="ts">
	import { t, locale } from 'svelte-i18n';

	let { children, data } = $props();

	locale.set(data.lang);
</script>

<svelte:head>
	<html lang={data.lang} />
</svelte:head>

<nav>
	<a href="/{data.lang}">{$t('nav_home')}</a>
	<a href="/{data.lang}/recipes">{$t('nav_recipes')}</a>
	<a href="/{data.lang}/cultures">{$t('nav_cultures')}</a>
	{#if data.user}
		<a href="/{data.lang}/profile/{data.user.address}">{$t('nav_profile')}</a>
		<a href="/{data.lang}/recipes/new">{$t('nav_publish')}</a>
	{/if}
</nav>

<main>
	{@render children()}
</main>

<footer>
	<span>{$t('footer_license')}</span>
	<span>{$t('footer_suite')}</span>
	<a href="/{data.lang}/admin/log">{$t('footer_admin_log')}</a>
</footer>
