<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { locale, waitLocale } from 'svelte-i18n';
	import { browser } from '$app/environment';

	let { children, data } = $props();

	if (browser) locale.set(data.lang ?? 'es');
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
