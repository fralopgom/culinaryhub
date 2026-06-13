import { env } from '$env/dynamic/private';
import db from './db';

// Configurable via env — alpha uses relaxed values
const DAILY_LIMIT_TIER1 = parseInt(env.DAILY_LIMIT_TIER1 ?? '1');
const DAILY_LIMIT_TIER2 = parseInt(env.DAILY_LIMIT_TIER2 ?? '3');
const DAILY_LIMIT_HIGH  = parseInt(env.DAILY_LIMIT_HIGH  ?? '10');
const MIN_WALLET_TIER   = parseInt(env.MIN_WALLET_TIER   ?? '0');

export function walletCanPublish(walletTier: number): boolean {
	return walletTier >= MIN_WALLET_TIER;
}

export async function dailyLimitReached(userId: string, walletTier: number, prestigeScore: number): Promise<boolean> {
	const limit =
		prestigeScore >= 500 ? DAILY_LIMIT_HIGH :
		walletTier >= 2      ? DAILY_LIMIT_TIER2 :
		                       DAILY_LIMIT_TIER1;

	const [{ count }] = await db`
		SELECT COUNT(*)::int AS count
		FROM prestige_events
		WHERE user_id    = ${userId}
		  AND source     = 'recipe_published'
		  AND created_at > now() - interval '1 day'
	`;

	return count >= limit;
}
