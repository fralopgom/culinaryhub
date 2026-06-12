<script lang="ts">
	import { t } from 'svelte-i18n';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>{$t('admin_ingredients')} — {$t('admin_dashboard')}</title></svelte:head>

<h1>{$t('admin_ingredients')}</h1>
<a href="/{data.lang}/admin">←</a>

<table>
	<thead><tr><th>ES</th><th>EN</th><th>Categoría</th><th></th></tr></thead>
	<tbody>
		{#each data.ingredients as i (i.id)}
			<tr>
				<td>{i.name_es}</td>
				<td>{i.name_en}</td>
				<td>{i.category ?? '—'}</td>
				<td>
					<form method="POST" action="?/delete" use:enhance style="display:inline">
						<input type="hidden" name="id" value={i.id} />
						<button type="submit">{$t('admin_delete')}</button>
					</form>
				</td>
			</tr>
		{/each}
	</tbody>
</table>

<h2>{$t('admin_add_ingredient')}</h2>
<form method="POST" action="?/add" use:enhance>
	<input type="text" name="name_es"  placeholder="Nombre ES" required />
	<input type="text" name="name_en"  placeholder="Name EN"   required />
	<input type="text" name="category" placeholder="Categoría" />
	<button type="submit">{$t('admin_add_ingredient')}</button>
</form>
