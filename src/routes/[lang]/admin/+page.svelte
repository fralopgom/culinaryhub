<script lang="ts">
	import { t } from 'svelte-i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>{$t('admin_dashboard')}</title></svelte:head>

<h1>{$t('admin_dashboard')}</h1>

<nav>
	<a href="/{data.lang}/admin/flags">{$t('admin_flags')} ({data.metrics.flagged_recipes})</a>
	<a href="/{data.lang}/admin/cultures">{$t('admin_cultures')}</a>
	<a href="/{data.lang}/admin/ingredients">{$t('admin_ingredients')}</a>
	<a href="/{data.lang}/admin/log">{$t('admin_audit_log')}</a>
</nav>

<dl>
	<dt>{$t('admin_metrics_recipes_today')}</dt>   <dd>{data.metrics.recipes_today}</dd>
	<dt>{$t('admin_metrics_active_flags')}</dt>    <dd>{data.metrics.active_flags}</dd>
	<dt>{$t('admin_metrics_flagged_recipes')}</dt> <dd>{data.metrics.flagged_recipes}</dd>
	<dt>{$t('admin_metrics_new_users')}</dt>        <dd>{data.metrics.new_users}</dd>
</dl>
