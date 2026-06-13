# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Laws (non-negotiable)
1. Do NOT read the same file twice in the same session.
2. Do NOT scan or summarize the entire repository upfront.
3. Be concise. No conversational fluff, preambles, or sycophantic greetings.
4. Always prefer targeted, small code edits over rewriting whole files.

---

## Commands

```bash
npm run dev        # dev server (localhost:5173)
npm run build      # production build
npm run check      # svelte-check — run before every commit
npm run preview    # preview production build locally
```

No test runner configured yet. `npm run check` is the main correctness gate.

---

## Architecture

### Request lifecycle

```
Browser → hooks.server.ts → route load() / API handler → response
```

`src/hooks.server.ts` runs on every request:
1. **Rate limiting** — 200 req/min per IP (in-memory Map, resets on restart)
2. **Native session** — reads `culinaryhub_session` cookie → `getSession()` → `locals.user`
3. **Wallet fallback** — if no native session, reads `sygnet_session` cookie → `verifySession()` (Sygnet API) → upserts `users` table → `locals.user`
4. **Security headers** — CSP, HSTS, X-Frame-Options on every response

`locals.user` is the single source of truth for the authenticated user throughout the request. Shape: `{ id, address, username, prestige_score, wallet_tier, is_admin, auth_type }`.

### Dual auth

Two independent auth paths, both resolve to `locals.user`:

| Cookie | Provider | Flow |
|--------|----------|------|
| `culinaryhub_session` | Google / GitHub OAuth | `/api/auth/[provider]` → OAuth redirect → `/api/auth/[provider]/callback` → INSERT session → set cookie |
| `sygnet_session` | MetaMask wallet (Sygnet) | Client signs message → Sygnet verifies → cookie set by Sygnet; this app just calls `verifySession()` |

`culinaryhub_session` takes **precedence** — checked first in hooks. Wallet users are auto-upserted into the local `users` table on every request.

Account tier (0/1/2) is computed from `created_at` age: <7 days = 0, <30 days = 1, else 2. Controls daily publish limits.

### Server library (`src/lib/server/`)

| File | Purpose |
|------|---------|
| `db.ts` | postgres.js client — tagged template SQL, already parameterized |
| `auth.ts` | Session CRUD, OAuth URL builders, token exchange (Google + GitHub) |
| `sygnet.ts` | Sygnet suite API calls — `verifySession`, `getPrestige`, `getIdentity` (uses `X-Suite-Key` header) |
| `admin.ts` | Admin-only DB helpers |
| `limits.ts` | Rate limit helpers for publish quotas by tier |

**Never import anything from `src/lib/server/` in client-side code.**

### Routes

- `src/routes/+layout.server.ts` — sets `lang` (from URL prefix `/es` or `/en`) and `user` for all pages
- `src/routes/[lang]/+layout.svelte` — nav (hamburger on mobile), footer; `$effect` sets svelte-i18n locale
- `src/routes/[lang]/` — public pages: home, recipes list, recipe detail, cultures tree, profile
- `src/routes/[lang]/recipes/new` — auth-gated publish form (client-side fetch to `/api/recipes`)
- `src/routes/[lang]/admin/` — admin pages (check `locals.user.is_admin` in load functions)
- `src/routes/api/` — JSON API endpoints: `auth/*`, `recipes`, `ratings`, `flags`, `session`

### i18n

All strings in `messages/es.json` and `messages/en.json`. The `[lang]` segment drives the locale — `es` is default. `$t('key')` in components, never hardcoded text. Add keys to both files simultaneously.

### Database

Migrations in `migrations/` (plain SQL, run manually):
```bash
# On NAS — apply new migration:
docker exec mycert psql -U paco -d culinaryhub -f /path/to/migration.sql
```

Tables: `users`, `sessions`, `recipes`, `recipe_versions`, `ingredients`, `recipe_ingredients`, `cultures`, `culinary_cultures`, `tags`, `recipe_tags`, `ratings`, `flags`, `notifications`, `mod_log`.

`author_id` **always** comes from `locals.user.id` — never trust the request body for ownership.

---

## Absolute rules

- `src/lib/server/` — server-only. Never import in client code.
- No `{@html userContent}` — XSS. Only sanitized server-generated HTML.
- All DB queries use tagged template literals (`db\`...\``) — never string concatenation.
- `author_id` always from verified session, never from request body.
- Every user-visible string uses `$t('key')` from svelte-i18n.

---

## Environment variables (required)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string — use `.87` IP (mycert container LAN IP), not `.30` (NAS host) |
| `SYGNET_API_URL` | `https://mycert.myqnapcloud.com:8443` — Sygnet backend for wallet auth |
| `SYGNET_SUITE_KEY` | Inter-suite auth key (sent as `X-Suite-Key` header to Sygnet API) |
| `SESSION_SECRET` | Used for signing cookies |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth — redirect URI: `https://culinaryhub.mysygnet.com/api/auth/google/callback` |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | OAuth — redirect URI: `https://culinaryhub.mysygnet.com/api/auth/github/callback` |

Env file on NAS: `/share/CACHEDEV1_DATA/culinaryhub/app.env` (owned by `admin`, requires `sudo` to edit).
`docker restart` does NOT re-read the env file — must `docker stop && docker rm && docker run --env-file` to apply changes.
