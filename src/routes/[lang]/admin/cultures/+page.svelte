<script lang="ts">
	import { t } from 'svelte-i18n';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Culture = { id: string; slug: string; name_es: string; name_en: string; parent_id: string | null; level: number };

	function indent(level: number) { return '—'.repeat(level); }
</script>

<svelte:head><title>{$t('admin_cultures')} — {$t('admin_dashboard')}</title></svelte:head>

<h1>{$t('admin_cultures')}</h1>
<a href="/{data.lang}/admin">←</a>

<table>
	<thead><tr><th>ES</th><th>EN</th><th>Level</th><th></th></tr></thead>
	<tbody>
		{#each data.cultures as c (c.id)}
			<tr>
				<td>{indent(c.level)} {c.name_es}</td>
				<td>{c.name_en}</td>
				<td>{c.level}</td>
				<td>
					<form method="POST" action="?/delete" use:enhance style="display:inline">
						<input type="hidden" name="id" value={c.id} />
						<button type="submit">{$t('admin_delete')}</button>
					</form>
				</td>
			</tr>
		{/each}
	</tbody>
</table>

<h2>{$t('admin_add_culture')}</h2>
<form method="POST" action="?/add" use:enhance>
	<input type="text" name="name_es" placeholder="Nombre ES" required />
	<input type="text" name="name_en" placeholder="Name EN"   required />
	<textarea name="description_es" placeholder="Descripción ES" rows="2"></textarea>
	<textarea name="description_en" placeholder="Description EN" rows="2"></textarea>
	<select name="parent_id">
		<option value="">— Sin padre (continente)</option>
		{#each data.cultures as c}
			<option value={c.id}>{'—'.repeat(c.level)} {c.name_es}</option>
		{/each}
	</select>
	<button type="submit">{$t('admin_add_culture')}</button>
</form>
