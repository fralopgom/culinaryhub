<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { locale } from 'svelte-i18n';
	import '$lib/i18n';
	import '../app.css';

	let { children, data } = $props();

	$effect(() => { locale.set(data.lang ?? 'es'); });
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
