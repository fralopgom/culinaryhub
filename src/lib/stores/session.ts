import { writable } from 'svelte/store';

export type Session = {
	address: string;
	username: string;
	prestige_score: number;
	wallet_tier: number;
} | null;

export const session = writable<Session>(null);
