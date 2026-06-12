// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	interface Window {
		ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<string[]> };
	}

	namespace App {
		interface Locals {
			user: {
				id: string;
				address: string | null;
				username: string;
				prestige_score: number;
				wallet_tier: number;
				is_admin: boolean;
				auth_type: 'wallet' | 'google' | 'github';
			} | null;
		}
	}
}

export {};
