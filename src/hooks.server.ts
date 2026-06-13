import type { Handle } from '@sveltejs/kit';
import { verifySession } from '$lib/server/sygnet';
import { getSession, computeAccountTier } from '$lib/server/auth';
import { createSeedRecipe } from '$lib/server/seed';

const securityHeaders = {
	'X-Frame-Options': 'DENY',
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
	'Content-Security-Policy':
		"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:"
};

const rateLimits = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 200;
const RATE_WINDOW = 60_000;

export const handle: Handle = async ({ event, resolve }) => {
	// Rate limiting
	const ip  = event.getClientAddress();
	const now = Date.now();
	const lim = rateLimits.get(ip);
	if (lim && now < lim.reset) {
		if (lim.count >= RATE_LIMIT) return new Response('Too Many Requests', { status: 429 });
		lim.count++;
	} else {
		rateLimits.set(ip, { count: 1, reset: now + RATE_WINDOW });
	}

	// OAuth / native session (Culinary Hub)
	const chToken = event.cookies.get('culinaryhub_session');
	if (chToken) {
		const row = await getSession(chToken);
		if (row && !row.is_banned) {
			event.locals.user = {
				id:             row.user_id,
				address:        row.address ?? null,
				username:       row.username,
				prestige_score: row.prestige_score,
				wallet_tier:    computeAccountTier(row.created_at),
				is_admin:       row.is_admin,
				auth_type:      (row.oauth_provider ?? 'wallet') as 'wallet' | 'google' | 'github'
			};
		}
	}

	// Sygnet wallet session (fallback for wallet-only users)
	if (!event.locals.user) {
		const syToken = event.cookies.get('sygnet_session');
		if (syToken) {
			const sygnetUser = await verifySession(syToken);
			if (sygnetUser) {
				const db = (await import('$lib/server/db')).default;
				const [row] = await db`
					INSERT INTO users (address, username, prestige_score, wallet_tier)
					VALUES (${sygnetUser.address}, ${sygnetUser.username}, ${sygnetUser.prestige_score}, ${sygnetUser.wallet_tier})
					ON CONFLICT (address) DO UPDATE SET
						username       = excluded.username,
						prestige_score = excluded.prestige_score,
						wallet_tier    = excluded.wallet_tier,
						updated_at     = now()
					RETURNING id, is_banned, is_admin, (xmax::text::bigint = 0) AS is_new
				`;
				if (row?.is_new) await createSeedRecipe(row.id);
				if (row && !row.is_banned) {
					event.locals.user = {
						id:             row.id,
						address:        sygnetUser.address,
						username:       sygnetUser.username,
						prestige_score: sygnetUser.prestige_score,
						wallet_tier:    sygnetUser.wallet_tier,
						is_admin:       row.is_admin,
						auth_type:      'wallet'
					};
				}
			}
		}
	}

	event.locals.user ??= null;

	const response = await resolve(event);
	Object.entries(securityHeaders).forEach(([k, v]) => response.headers.set(k, v));
	return response;
};
