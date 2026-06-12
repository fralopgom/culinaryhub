# Culinary Hub — Claude Code Instructions

## Development Laws (non-negotiable)
1. Do NOT read the same file twice in the same session.
2. Do NOT scan or summarize the entire repository upfront.
3. Be concise. No conversational fluff, preambles, or sycophantic greetings.
4. Always prefer targeted, small code edits over rewriting whole files.

## Stack
- **Frontend/Backend:** SvelteKit (TypeScript, Svelte 5 runes)
- **i18n:** svelte-i18n — all user-facing strings in `messages/es.json` and `messages/en.json`. Zero hardcoded text in components.
- **Database:** PostgreSQL via postgres.js (`src/lib/server/db.ts`)
- **Auth:** Sygnet session cookie (`sygnet_session` on `.sygnet.app`) — verified server-side
- **PWA:** vite-plugin-pwa

## Absolute rules
- `src/lib/server/` — server-only. Never import in client code.
- No `{@html userContent}` — XSS vector. Only sanitized server-generated HTML.
- All DB queries parameterized — no string concatenation.
- `author_id` always from verified session, never from request body.
- Every user-visible string uses `$t('key')` from svelte-i18n.

## Commands
```bash
npm run dev        # dev server
npm run build      # production build
npm run preview    # preview build
```

## Environment variables
See `.env.example`. Required: `DATABASE_URL`, `SYGNET_API_URL`, `SYGNET_SUITE_KEY`.
