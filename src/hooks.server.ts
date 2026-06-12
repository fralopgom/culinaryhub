import type { Handle } from '@sveltejs/kit';
import { verifySession } from '$lib/server/sygnet';

// Security headers applied to every response
const securityHeaders = {
	'X-Frame-Options': 'DENY',
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
	'Content-Security-Policy':
		"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:"
};

// In-memory rate limiter (per IP, resets on server restart)
// Replace with Redis for multi-instance deployments
const rateLimits = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 200;
const RATE_WINDOW = 60_000;

export const handle: Handle = async ({ event, resolve }) => {
	// Rate limiting
	const ip = event.getClientAddress();
	const now = Date.now();
	const limit = rateLimits.get(ip);
	if (limit && now < limit.reset) {
		if (limit.count >= RATE_LIMIT) {
			return new Response('Too Many Requests', { status: 429 });
		}
		limit.count++;
	} else {
		rateLimits.set(ip, { count: 1, reset: now + RATE_WINDOW });
	}

	// Session from Sygnet cookie
	const sessionToken = event.cookies.get('sygnet_session');
	if (sessionToken) {
		const user = await verifySession(sessionToken);
		event.locals.user = user ?? null;
	} else {
		event.locals.user = null;
	}

	const response = await resolve(event);

	// Apply security headers
	Object.entries(securityHeaders).forEach(([key, value]) => {
		response.headers.set(key, value);
	});

	return response;
};
