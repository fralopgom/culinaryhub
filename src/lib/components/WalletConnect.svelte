<script lang="ts">
	import { t } from 'svelte-i18n';
	import { session } from '$lib/stores/session';


	let connecting = $state(false);
	let error      = $state('');

	async function connect() {
		if (typeof window.ethereum === 'undefined') {
			error = 'MetaMask not found';
			return;
		}
		connecting = true;
		error = '';
		try {
			const accounts: string[] = await window.ethereum.request({ method: 'eth_requestAccounts' });
			if (accounts[0]) {
				const res = await fetch('/api/session');
				const { user } = await res.json();
				session.set(user);
			}
		} catch (e) {
			error = (e as Error).message;
		} finally {
			connecting = false;
		}
	}

	async function disconnect() {
		session.set(null);
	}
</script>

{#if $session}
	<span title={$session.address}>
		{$t('wallet_connected', { values: { address: $session.address.slice(0, 6) + '…' + $session.address.slice(-4) } })}
	</span>
	<button onclick={disconnect}>{$t('wallet_disconnect')}</button>
{:else}
	<button onclick={connect} disabled={connecting}>
		{connecting ? '…' : $t('wallet_connect')}
	</button>
	{#if error}<span>{error}</span>{/if}
{/if}
