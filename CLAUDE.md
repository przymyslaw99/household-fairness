# Repository Guidelines

Use this file for repo-specific operating rules. Read `@README.md` for setup and architecture detail.

## Hard Rules

- Treat `AGENTS.md` as the source of truth for AI instructions; `CLAUDE.md` must remain an identical mirror generated from it.
- Do not modify files under `context/archive/`; treat them as immutable history.
- Use `@/*` imports for paths that would otherwise traverse above the current feature directory; keep relative imports only for same-folder siblings such as `./Button`.
- Use `cn()` from `src/lib/utils.ts` for conditional Tailwind classes; do not hand-concatenate class strings.
- Prefer Astro components for static UI; use React components only for interactivity.
- Do not introduce Next.js directives such as `"use client"`.
- Keep server secrets in `astro:env/server`; never expose `SUPABASE_URL` or `SUPABASE_KEY` to client code.

## Build, Lint, and Dev Commands

See `@package.json` for the full script list. Before finishing work, run `npm run lint` and `npm run build`.

Run `npm run lint:fix` before manual ESLint cleanup; if lint still fails, inspect the remaining errors instead of hand-editing files for formatter-only noise. Expect staged `*.ts`, `*.tsx`, `*.astro`, `*.json`, `*.css`, and `*.md` files to be rewritten by the pre-commit hooks configured in `@package.json`.

## Project Structure

- `src/pages/` contains Astro pages, auth pages, and API routes.
- `src/pages/api/auth/` holds redirect-based auth handlers.
- `src/middleware.ts` resolves the current user and protects paths listed in `PROTECTED_ROUTES`.
- `src/lib/supabase.ts` creates the server-side Supabase client from request cookies.
- `src/components/ui/` contains shared UI primitives; `src/components/auth/` contains auth form components.
- `supabase/migrations/` is for database changes; enable RLS and least-privilege policies on new tables.

## CI and Review Gate

See `@.github/workflows/ci.yml` for the exact CI commands. If you add a protected route, update `PROTECTED_ROUTES` in `src/middleware.ts` and confirm an anonymous request to that path redirects to `/auth/signin`.
