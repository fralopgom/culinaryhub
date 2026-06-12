<script lang="ts">
	import { t } from 'svelte-i18n';

	let { count = 0, lang }: { count: number; lang: string } = $props();
</script>

<a href="/{lang}/notifications" aria-label={$t('nav_notifications')}>
	🔔{#if count > 0}<sup>{count}</sup>{/if}
</a>
