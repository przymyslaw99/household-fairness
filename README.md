# Household Fairness

Household Fairness is an MVP for making household work visible and easier to discuss. It tracks members, chores, contributions, and a simple fairness score so a household can see whether responsibilities are balanced without turning the app into an automatic settlement or gamification system.

The product favors explicit, owner-defined rules over hidden automation. A household owner defines the chores and expectations; members can see the resulting balance and the current fairness percentage.

## Product Scope

The MVP focuses on:

- household setup with owner and member roles;
- owner-managed chores and responsibilities;
- visible contribution tracking;
- a simple fairness score;
- clear household-level state that can be reviewed and adjusted manually.

The MVP intentionally avoids:

- automatic financial settlement;
- complex gamification;
- hidden scoring rules;
- background automation that changes household responsibilities without an explicit user action.

## Tech Stack

- Astro for pages, routing, and mostly static UI.
- React for interactive components only.
- Tailwind CSS for styling.
- Supabase for auth and persistence.
- Server-side environment access through `astro:env/server`.

Keep Supabase credentials on the server side. Do not expose `SUPABASE_URL`, `SUPABASE_KEY`, or equivalent secrets to client code.

## Getting Started

Install dependencies:

```bash
npm install
```

Create the required local environment variables using the project's environment setup. Keep secret values out of Git and out of client-side code.

Start the development server:

```bash
npm run dev
```

Before finishing a change, run:

```bash
npm run lint
npm run build
```

For formatter or ESLint auto-fixes, run:

```bash
npm run lint:fix
```

If lint still fails after `lint:fix`, inspect the remaining errors instead of hand-editing formatter-only noise.

## Useful Scripts

The full script list lives in `package.json`. The commands used most often are:

- `npm run dev` - start local development.
- `npm run lint` - run lint checks.
- `npm run lint:fix` - apply supported lint and formatting fixes.
- `npm run build` - create a production build.
- `npm run sync:ai-rules` - sync AI instruction mirrors when applicable.

## Project Structure

- `src/pages/` contains Astro pages, auth pages, and API routes.
- `src/pages/api/auth/` contains redirect-based auth handlers.
- `src/middleware.ts` resolves the current user and protects configured routes.
- `src/lib/supabase.ts` creates the server-side Supabase client from request cookies.
- `src/components/ui/` contains shared UI primitives.
- `src/components/auth/` contains auth form components.
- `supabase/migrations/` contains database migrations and RLS policy changes.
- `context/` contains project planning, change records, and foundation documents.

## Auth And Protected Routes

Protected pages are controlled by `PROTECTED_ROUTES` in `src/middleware.ts`. When adding a protected route, update that list and confirm that an anonymous request redirects to `/auth/signin`.

Auth handlers live under `src/pages/api/auth/`. Keep auth behavior server-oriented and avoid exposing server secrets or privileged Supabase access to the browser.

## Development Rules

Use `AGENTS.md` as the source of truth for AI and repo-specific operating rules. `CLAUDE.md` is a generated mirror and should remain identical when synced.

Code conventions:

- Use `@/*` imports for paths that would otherwise traverse above the current feature directory.
- Use relative imports only for same-folder siblings such as `./Button`.
- Use `cn()` from `src/lib/utils.ts` for conditional Tailwind classes.
- Prefer Astro components for static UI.
- Use React only where interactivity is needed.
- Do not add Next.js directives such as `"use client"`.
- Enable RLS and least-privilege policies for new Supabase tables.

Do not modify files under `context/archive/`; archived changes are immutable history.

## CI And Review

CI configuration lives in `.github/workflows/ci.yml`. Keep local verification aligned with CI by running lint and build before handing off a change.

For implementation review, this repository follows the 10xDevs review chain:

```text
/10x-implement -> /10x-impl-review -> triage -> (/10x-lesson | fix | skip | disagree)
```

Review findings are triaged by impact. Critical findings should be fixed; low-impact findings can be consciously skipped or recorded as accepted risk.
