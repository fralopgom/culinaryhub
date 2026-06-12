<script lang="ts">
	import { t } from 'svelte-i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>{$t('admin_audit_log')} — {$t('meta_site_name')}</title></svelte:head>

<h1>{$t('admin_audit_log')}</h1>

<table>
	<thead>
		<tr>
			<th>Date</th><th>Admin</th><th>Action</th><th>Target</th><th>Reason</th>
		</tr>
	</thead>
	<tbody>
		{#each data.actions as a}
			<tr>
				<td>{new Date(a.created_at).toLocaleString(data.lang)}</td>
				<td><a href="/{data.lang}/profile/{a.admin_address}">{a.admin_username}</a></td>
				<td>{a.action}</td>
				<td>{a.target_id ?? '—'}</td>
				<td>{a.reason}</td>
			</tr>
		{/each}
	</tbody>
</table>

{#if data.page > 1}<a href="?page={data.page - 1}">←</a>{/if}
{#if data.actions.length === 50}<a href="?page={data.page + 1}">→</a>{/if}
