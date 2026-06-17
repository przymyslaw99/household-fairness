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

<!-- BEGIN @przeprogramowani/10x-cli -->

## 10xDevs AI Toolkit - Module 2, Lesson 3

Review AI-generated code before merge with the **implementation review chain**:

```
/10x-implement -> /10x-impl-review -> triage -> (/10x-lesson | fix | skip | disagree)
```

`/10x-impl-review` is the lesson focus. Review is a quality gate, not an instruction to fix every finding.

### Task Router - Where to start

| Skill | Use it when |
| --- | --- |
| **Code review (lesson focus)** | |
| `/10x-impl-review <change-id>` | You have implemented code and want a structured review before merge. The skill checks plan adherence, scope discipline, safety and quality, architecture, pattern consistency, and success criteria, then presents findings for triage. |
| **Recurring lesson outcome** | |
| `/10x-lesson` | A finding reveals a recurring project rule or agent failure pattern. Record it in `context/foundation/lessons.md` instead of treating it as a one-off note. |

### Triage discipline

- Severity says how bad the finding is. Impact says how much the decision matters now.
- Valid outcomes: fix now, fix differently, skip, accept as risk, record as recurring rule (`/10x-lesson`), disagree.
- Fix critical findings. Do not burn hours on low-impact observations just because the agent found them.
- Conscious skipping of low-impact findings is a valid review outcome, not negligence.
- If you disagree with a finding, record why. Wrong agent reasoning is also signal.

### Review boundaries

- This lesson reviews implemented code. It does not create the plan, execute new phases, or teach CI review.
- Testing strategy and quality gates are introduced in Module 3.
- Do not use `/10x-contract` as a triage outcome in this lesson.

### Paths used by this lesson

- `context/changes/<change-id>/plan.md` - expected implementation contract
- `context/changes/<change-id>/reviews/` - review output
- `context/foundation/lessons.md` - recurring lessons

Skills must not write to `context/archive/`. Archived changes are immutable; if a resolved target path starts with `context/archive/`, abort with: "This change is archived. Open a new change with `/10x-new` instead."

<!-- END @przeprogramowani/10x-cli -->
