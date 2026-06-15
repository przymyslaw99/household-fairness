# First Production Deploy on Cloudflare Workers

## Summary

Use **Cloudflare Workers** as the source of truth for this deployment. Treat `cloudflare-pages` in `context/foundation/tech-stack.md` as stale metadata, not an execution target. Scope is **manual first production deploy only**: no CI/CD rollout and no custom domain in this pass.

Current repo state before deploy:
- `npm run build` passes.
- `npm run lint` failed on CRLF normalization and a Node global in `scripts/sync-ai-rules.mjs`.
- The Worker name was still starter-shaped (`10x-astro-starter`).
- Astro 6 + `@astrojs/cloudflare` auto-enables a Cloudflare KV-backed session driver, so the deploy should explicitly provision and bind `SESSION` instead of leaving that implicit.

## Key Changes

### Preflight cleanup

- Normalize line endings so `npm run lint` stops failing on `prettier/prettier` CRLF errors across the repo.
- Fix the real lint issue in `scripts/sync-ai-rules.mjs` by declaring Node globals in ESLint flat config.
- Re-run `npm run lint` and `npm run build`; require both green before publish.

### Workers target hardening

- Update `wrangler.jsonc` Worker name from `10x-astro-starter` to `a-smieci-wyniosles`.
- Keep the existing Worker runtime path: `@astrojs/cloudflare`, `output: "server"`, `npx wrangler deploy`.
- Do not switch to Pages commands or Pages-specific config.

### Runtime bindings and secrets

- Create a Cloudflare KV namespace dedicated to Astro sessions and bind it as `SESSION` in `wrangler.jsonc`.
- Keep `ASSETS` binding as-is.
- Do not add `IMAGES` binding in this pass; there is no evidence of runtime image-service usage in app code.
- Set production Worker secrets:
  - `SUPABASE_URL`
  - `SUPABASE_KEY`
- Use a hosted Supabase project for production values, not local `.env` or `.dev.vars`.

## Manual Deploy Flow

1. Export `CLOUDFLARE_API_TOKEN` in the shell before any Wrangler command; non-interactive runs in this environment require token auth.
2. Create a KV namespace for Astro sessions with `npx wrangler kv namespace create SESSION` and replace `__CLOUDFLARE_KV_NAMESPACE_ID__` in `wrangler.jsonc` with the returned namespace id.
3. Set Worker secrets with:
   - `npx wrangler secret put SUPABASE_URL`
   - `npx wrangler secret put SUPABASE_KEY`
4. Run `npm run lint`.
5. Run `npm run build`.
6. Publish with `npx wrangler deploy`.
7. Use the default Workers production URL for this first release; leave custom domain wiring for a later pass.

## Test Plan

### Pre-deploy checks

- `npm run lint` passes with no CRLF/prettier flood.
- `npm run build` passes after config updates.
- Wrangler config resolves with the final Worker name and `SESSION` binding present.

### Smoke tests on production

- `/` loads successfully.
- Anonymous request to `/dashboard` redirects to `/auth/signin`.
- `/auth/signup` and `/auth/signin` render successfully.
- If Supabase email confirmation is enabled, signup lands on the confirm-email flow without 500s.
- If confirmation is disabled in the hosted project, signup then signin succeeds and `/dashboard` loads authenticated content.
- `npx wrangler tail` stays clean during auth flow checks.

### Error signals to watch

- `Invalid binding 'SESSION'` or session-storage init errors: KV binding missing or misconfigured.
- 500s on auth routes: bad `SUPABASE_URL` or `SUPABASE_KEY`.
- Redirect loop or immediate logout after signin: cookie/runtime mismatch.
- Sitemap skipped warning: expected for now, non-blocking.

## Assumptions

- Source of truth for runtime is **Cloudflare Workers**, not Pages.
- First release goes to the default Workers URL with slug `a-smieci-wyniosles`.
- CI/CD and custom domain are explicitly out of scope for this pass.
- Production Supabase credentials will be supplied manually during execution.
- Cloudflare access will be provided via `CLOUDFLARE_API_TOKEN`.
- The safest implementation choice is to **explicitly provision `SESSION` KV now** rather than rely on adapter defaults staying implicit at runtime.
