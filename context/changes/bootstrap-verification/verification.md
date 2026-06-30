---
bootstrapped_at: 2026-06-13T13:57:36Z
starter_id: 10x-astro-starter
starter_name: "10x Astro Starter (Astro + Supabase + Cloudflare)"
project_name: household-fairness
language_family: js
package_manager: npm
cwd_strategy: git-clone
bootstrapper_confidence: first-class
phase_3_status: ok
audit_command: npm audit --json
---

## Hand-off

```yaml
starter_id: 10x-astro-starter
package_manager: npm
project_name: household-fairness
hints:
  language_family: js
  team_size: solo
  deployment_target: cloudflare-pages
  ci_provider: github-actions
  ci_default_flow: auto-deploy-on-merge
  bootstrapper_confidence: first-class
  path_taken: standard
  quality_override: false
  self_check_answers: null
  has_auth: true
  has_payments: false
  has_realtime: false
  has_ai: false
  has_background_jobs: false
```

## Why this stack

This is a small web app for a solo builder shipping an MVP in 3 weeks after hours, with authentication as a must-have from day one. The recommended JavaScript path fits best because it keeps frontend and backend in one opinionated stack, includes auth and database primitives early, and stays closer to existing React and JavaScript experience than a split Python backend plus separate frontend. Cloudflare Pages matches the starter's default deployment path, while GitHub Actions with auto-deploy on merge keeps delivery simple for a small greenfield project.

## Pre-scaffold verification

| Signal | Value | Severity | Notes |
| --- | --- | --- | --- |
| npm package | not run | n/a | starter uses `git clone`, so no `create-*` npm package was derived from `cmd_template` |
| GitHub repo | `przeprogramowani/10x-astro-starter` last pushed `2026-05-17T10:33:39Z` | fresh | resolved from `card.docs_url` via GitHub API |

## Scaffold log

**Resolved invocation**: `git clone https://github.com/przeprogramowani/10x-astro-starter .bootstrap-scaffold && cd .bootstrap-scaffold && npm install`
**Strategy**: `git-clone`
**Exit code**: `0`
**Files moved**: `31535`
**Conflicts (.scaffold siblings)**: `.vscode/settings.json`
**.gitignore handling**: `moved silently`
**.bootstrap-scaffold cleanup**: `deleted`

## Post-scaffold audit

**Tool**: `npm audit --json`
**Summary**: `0` CRITICAL, `11` HIGH, `7` MODERATE, `0` LOW
**Direct vs transitive**: `0/5/1/0` direct of total `0/11/7/0`
**Exit code**: `1` (`npm audit` returns non-zero when findings exist)

#### CRITICAL findings

None.

#### HIGH findings

- `@astrojs/cloudflare` — direct dependency; via `astro`, `vite`, `wrangler`; affected range `<0.0.0-vercel-speed-insights-20230912155045 || >=6.3.0`; suggested fix `@astrojs/cloudflare@6.2.4` (semver-major).
- `@astrojs/react` — direct dependency; via `@vitejs/plugin-react`, `vite`; affected range `<=0.0.0-toolbar-improvements-20240405144822 || >=3.0.0-beta.0`; suggested fix `@astrojs/react@3.6.2` (semver-major).
- `@cloudflare/vite-plugin` — transitive dependency; via `miniflare`, `vite`, `wrangler`, `ws`; affected range `*`; fix available.
- `@tailwindcss/vite` — direct dependency; via `vite`; affected range `<=4.2.1`; fix available.
- `@vitejs/plugin-react` — transitive dependency; via `vite`; affected range `4.0.0-beta.0 - 5.1.4`; suggested fix through `@astrojs/react@3.6.2` (semver-major).
- `astro` — direct dependency; via `esbuild`, `vite`; affected range `<=0.0.0-head-body-content-20240329190922 || 2.2.0 - 7.0.0-alpha.1`; suggested fix `astro@2.4.5` (semver-major).
- `devalue` — transitive dependency; via advisory `1120448`; affected range `5.6.3 - 5.8.0`; fix available.
- `esbuild` — transitive dependency; via advisories `1120679`, `1120680`; affected range `0.17.0 - 0.28.0`; suggested fix through `astro@2.4.5` (semver-major).
- `vite` — transitive dependency; via `esbuild`; affected range `4.2.0-beta.0 - 8.0.3`; suggested fix through `@astrojs/react@3.6.2` (semver-major).
- `vitefu` — transitive dependency; via `vite`; affected range not surfaced by `npm audit`; fix available.
- `wrangler` — direct dependency; via `esbuild`, `miniflare`; affected range `<=0.0.0-kickoff-demo || >=3.7.0`; suggested fix `wrangler@3.6.0` (semver-major).

#### MODERATE findings

- `@astrojs/check` — direct dependency; via `@astrojs/language-server`; affected range `>=0.9.3`; suggested fix `@astrojs/check@0.9.2` (semver-major).
- `@astrojs/language-server` — transitive dependency; via `volar-service-yaml`; affected range `>=2.14.0`; suggested fix through `@astrojs/check@0.9.2` (semver-major).
- `miniflare` — transitive dependency; via `ws`; affected range `<=0.0.0-fff677e35 || 3.20250204.0 - 4.20260518.0`; suggested fix through `wrangler@3.6.0` (semver-major).
- `volar-service-yaml` — transitive dependency; via `yaml-language-server`; affected range `<=0.0.70`; suggested fix through `@astrojs/check@0.9.2` (semver-major).
- `ws` — transitive dependency; via advisory `1119108`; affected range `8.0.0 - 8.20.0`; suggested fix through `wrangler@3.6.0` (semver-major).
- `yaml` — transitive dependency; via advisory `1115556`; affected range `2.0.0 - 2.8.2`; suggested fix through `@astrojs/check@0.9.2` (semver-major).
- `yaml-language-server` — transitive dependency; via `yaml`; affected range `1.11.1-08d5f7b.0 - 1.21.1-f1f5a94.0 || 1.22.1-0ae5603.0 - 1.22.1-fc5f874.0`; suggested fix through `@astrojs/check@0.9.2` (semver-major).

#### LOW / INFO findings

None.

## Hints recorded but not acted on

| Hint | Value |
| --- | --- |
| bootstrapper_confidence | `first-class` |
| quality_override | `false` |
| path_taken | `standard` |
| self_check_answers | `null` |
| team_size | `solo` |
| deployment_target | `cloudflare-pages` |
| ci_provider | `github-actions` |
| ci_default_flow | `auto-deploy-on-merge` |
| has_auth | `true` |
| has_payments | `false` |
| has_realtime | `false` |
| has_ai | `false` |
| has_background_jobs | `false` |

## Next steps

Next: a future skill will set up agent context (`CLAUDE.md`, `AGENTS.md`). For now, your project is scaffolded and verified.

Useful manual steps in the meantime:
- `git init` (if you have not already) to start your own repo history.
- Review any `.scaffold` siblings the conflict policy created and decide which version of each file to keep.
- Address audit findings per your project's risk tolerance — the full breakdown is in this log.
