<script lang="ts">
	import { t } from 'svelte-i18n';
	import { invalidateAll } from '$app/navigation';

	let { user = null }: { user?: { address?: string | null; auth_type?: string } | null } = $props();

	let connecting = $state(false);
	let error      = $state('');

	const isWalletUser = $derived(!!user?.address && user.auth_type === 'wallet');

	async function connect() {
		if (typeof window.ethereum === 'undefined') {
			error = $t('wallet_not_found');
			return;
		}
		connecting = true;
		error = '';
		try {
			const accounts: string[] = await window.ethereum.request({ method: 'eth_requestAccounts' });
			const address = accounts[0];
			if (!address) throw new Error('no_account');

			const message = `Culinary Hub — Verify wallet ownership\nAddress: ${address}\nTimestamp: ${Date.now()}`;
			const signature = await window.ethereum.request({
				method: 'personal_sign',
				params: [message, address]
			}) as unknown as string;

			const res = await fetch('/api/auth/wallet', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ address, message, signature })
			});

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.message ?? 'auth_failed');
			}

			await invalidateAll(); // re-run all server load functions → locals.user refreshed
		} catch (e: unknown) {
			const msg = (e as { code?: number; message?: string });
			if (msg.code === 4001) { error = ''; } // user rejected — silent
			else error = msg.message ?? 'unknown_error';
		} finally {
			connecting = false;
		}
	}
</script>

{#if isWalletUser && user?.address}
	<span class="wallet-addr" title={user.address}>
		{user.address.slice(0, 6)}…{user.address.slice(-4)}
	</span>
{:else if !user}
	<button onclick={connect} disabled={connecting} class="wallet-btn">
		{connecting ? '…' : $t('wallet_connect')}
	</button>
	{#if error}<span class="wallet-err">{error}</span>{/if}
{/if}

<style>
.wallet-btn {
	font-size: 0.8rem;
	padding: 0.3rem 0.75rem;
	border-radius: var(--radius);
	background: var(--bg);
	border: 1px solid var(--border);
	cursor: pointer;
	color: var(--muted);
}
.wallet-btn:hover { border-color: var(--accent); color: var(--accent); }

.wallet-addr {
	font-size: 0.75rem;
	color: var(--muted);
	font-family: monospace;
	padding: 0.3rem 0.5rem;
	background: var(--bg);
	border-radius: var(--radius);
	border: 1px solid var(--border);
}

.wallet-err { font-size: 0.75rem; color: #c0392b; }
</style>
