---
project: a-smieci-wyniosles
researched_at: 2026-06-14
recommended_platform: Cloudflare Workers
runner_up: Netlify
context_type: mvp
tech_stack:
  language: TypeScript
  framework: Astro 6 + React 19
  runtime: Cloudflare Workers
---

## Recommendation

**Deploy on Cloudflare Workers.**

This repo is already configured for `@astrojs/cloudflare`, `wrangler`, `output: "server"`, and a Worker entrypoint, so Cloudflare has the lowest migration risk and the fastest path to a working MVP. With your answers (`single region is fine`, `external providers are fine`, no strong cost-vs-DX preference, and only 3 weeks to ship), the winning factor is minimizing platform-change work rather than chasing a theoretically better generic host.

## Platform Comparison

Scoring uses the five criteria from `agent-friendly-criteria.md` with `Pass = 2`, `Partial = 1`, `Fail = 0`.

| Platform | CLI-first | Managed / Serverless | Agent-readable docs | Stable deploy API | MCP / Integration | Total |
|---|---|---|---|---|---|---|
| Cloudflare Workers | Pass | Pass | Pass | Pass | Pass | 10 |
| Netlify | Pass | Pass | Pass | Pass | Pass | 10 |
| Railway | Pass | Partial | Pass | Pass | Pass | 9 |
| Vercel | Pass | Pass | Pass | Pass | Partial | 9 |
| Render | Partial | Partial | Partial | Pass | Pass | 8 |
| Fly.io | Pass | Partial | Pass | Pass | Partial | 8 |

### Notes Per Platform

**Cloudflare Workers**

Best fit for the current codebase. Astro officially supports the Cloudflare adapter, Cloudflare publishes `llms.txt` and markdown docs, `wrangler` covers deploy/version flows, and the platform has managed MCP servers. Pricing is MVP-friendly: Workers pricing includes a low paid floor and examples show 15M requests with light CPU still staying inexpensive, with static assets free and unlimited. Supabase is also a documented third-party integration on Workers. Sources: [Astro Cloudflare adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/), [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Workers llms](https://developers.cloudflare.com/workers/llms.txt), [Cloudflare MCP servers](https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/).

**Netlify**

Excellent Astro support and very strong agent ergonomics: official Astro guide, `llms.txt`, Netlify CLI, CLI log access, deploy previews, and an official MCP track. It loses only because this repo is not on the Netlify adapter today. Moving here means changing the adapter and re-validating auth/session behavior on Netlify Functions and Edge Functions instead of shipping on the runtime already configured in the repo. Sources: [Netlify pricing](https://www.netlify.com/pricing/), [Astro on Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/astro/), [Netlify llms](https://docs.netlify.com/llms.txt), [Function logs](https://docs.netlify.com/build/functions/logs/).

**Railway**

Strong all-in-one PaaS option with a good CLI, hosted/local MCP support, Astro deployment docs, and simple region control. It is attractive if you wanted a more traditional app host and co-located services, but for this MVP it adds migration work from the current Worker runtime to a Node or Docker deployment model. Good fallback if Cloudflare-specific runtime issues start dominating the schedule. Sources: [Railway pricing](https://railway.com/pricing), [Railway llms](https://docs.railway.com/llms.txt), [Astro on Railway](https://docs.railway.com/guides/astro), [Railway CLI](https://docs.railway.com/cli).

**Vercel**

Very strong on docs, CLI, rollbacks, logs, and framework support, and it supports Astro directly. It falls behind the top three here because the repo is not using Vercel's preferred runtime path today, and Vercel's MCP server is explicitly marked `beta` in the docs, which weakens the fifth criterion slightly. Sources: [Vercel pricing](https://vercel.com/pricing), [Vercel llms](https://vercel.com/llms.txt), [Vercel CLI](https://vercel.com/docs/cli), [Vercel Storage](https://vercel.com/docs/storage).

**Render**

Render is viable, especially if you want a classic web service plus managed Postgres, WebSockets, previews, and an MCP server. For this repo, however, it requires moving off the Cloudflare adapter to the Node adapter and running Astro as a web service, which adds more surface area than needed for a 3-week MVP. Render's docs also lean more toward dashboard flows than the top options. Sources: [Render pricing](https://render.com/pricing), [Deploy Astro on Render](https://render.com/docs/deploy-astro), [Render MCP server](https://render.com/docs/mcp-server).

**Fly.io**

Fly is the most flexible option in the pool for persistent processes, custom networking, and VM-style control. That flexibility is exactly why it ranks lower for this MVP: it is more operationally involved than needed, requires a credit card on file, and would move the project away from the current serverless Worker path into container/VM deployment. Strong option if the app later grows into background workers or long-lived connections. Sources: [Fly pricing](https://fly.io/docs/about/pricing/), [flyctl](https://fly.io/docs/flyctl/), [Fly Machines](https://fly.io/docs/machines/), [Fly MCP](https://fly.io/docs/mcp/).

### Shortlisted Platforms

#### 1. Cloudflare Workers (Recommended)

It won because the repo is already pointed at this runtime, the deploy API is mature (`wrangler deploy`, versions, rollbacks), docs are highly agent-readable, and the platform cost/ops profile is well matched to a solo MVP. This is the option with the smallest gap between "works in the repo now" and "works in production."

#### 2. Netlify

Netlify scored equally on platform quality, but not equally on migration cost. It is the cleanest non-Cloudflare alternative for Astro if you decide you want more conventional SSR ergonomics or richer out-of-the-box preview workflows, but it still requires an adapter/runtime change.

#### 3. Railway

Railway scored third because it is operationally simpler than Fly/Render while still supporting Astro, logs, regions, and agent tooling well. The gap versus Cloudflare is mainly that this project would stop being a Worker deployment and become a Node/Docker deployment.

## Anti-Bias Cross-Check: Cloudflare Workers

### Devil's Advocate — Weaknesses

1. The current stack is tied to the Workers runtime, so if an auth/session edge case appears under `workerd`, you debug platform behavior instead of shipping product features.
2. `nodejs_compat` reduces friction but does not turn Workers into a full Node server; some packages still behave differently enough to cost time under deadline pressure.
3. Rollbacks cover Worker code versions, not your Supabase data shape or any downstream side effects, so "rollback available" can create a false sense of safety.
4. The repo's Cloudflare fit is a benefit now, but also a mild form of deployment lock-in: a later move to another provider means re-validating adapter behavior, env access, and build output.

### Pre-Mortem — How This Could Fail

The team assumed that because the starter already used the Cloudflare adapter, deployment risk was basically solved. That assumption held for the happy path but failed under real product pressure. As authentication, protected routes, and score-calculation views became more interconnected, subtle differences between local development and the deployed Workers runtime began to matter. A package that was "Node-compatible enough" in theory behaved differently under `workerd`, and cookies or request context handling around Supabase took longer to stabilize than expected. Instead of polishing the core household flows, time got consumed by platform debugging, deployment retries, and uncertainty about whether a bug came from Astro, Cloudflare, or application logic. The final problem was not that Cloudflare was the wrong platform in general. It was that the team underestimated the cost of runtime-specific issues during a short MVP cycle and treated "already configured in the starter" as equivalent to "operationally risk-free."

### Unknown Unknowns

- `compatibility_date` in `wrangler.jsonc` is load-bearing. Changing it can alter runtime behavior even if your application code did not change.
- Astro 6 on Cloudflare has a version-specific workflow: the local dev server can already model the target platform well enough that older advice to build around separate legacy commands can be misleading.
- `wrangler` versions and rollbacks are strong for code safety, but they do not revert secret changes, external service changes, or database migrations.
- The project currently points at Workers deploy semantics, not Pages deploy semantics. Using the wrong Cloudflare command family later is an easy operational mistake.

## Operational Story

How the chosen platform operates day to day for this repo.

- **Preview deploys**: recommended MVP flow is local verification with `npm run build` and `npm run preview`, then production publish via `npx wrangler deploy`; if you later connect the repo to Cloudflare Builds, the platform supports automatic pull request previews for Git-based workflows.
- **Secrets**: store `SUPABASE_URL` and `SUPABASE_KEY` as Worker secrets with `npx wrangler secret put SUPABASE_URL` and `npx wrangler secret put SUPABASE_KEY`; names are visible in Cloudflare, values are not recoverable after set.
- **Rollback**: use the dashboard rollback flow or `wrangler rollback` to promote a previous Worker version; Cloudflare notes that connected resources are not changed during rollback, so schema/data changes remain your responsibility.
- **Approval**: human-only for first production publish, deleting the Worker, rotating primary Cloudflare or Supabase credentials, and any destructive database action; agent-safe tasks are lint, build, deploy, and read-only log/version inspection.
- **Logs**: use `npx wrangler tail` for live runtime logs during deploy/debug sessions, and Cloudflare Observability for dashboard log review; deployment/version state is tracked through Wrangler versions/deployments.

## Risk Register

| Risk | Source | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| A package works in Node but fails subtly under `workerd` | Devil's advocate | M | H | Keep dependencies conservative, test auth/protected routes early on deployed preview/prod, and avoid adding Node-heavy server packages unless verified against Workers docs. |
| False confidence from rollback support | Devil's advocate | M | H | Separate code deploys from schema changes; do not pair risky DB changes with the same release unless rollback steps for data are explicit. |
| Runtime-specific debugging consumes MVP time | Pre-mortem | M | H | Deploy the auth flow early, not at the end; validate sign-up, sign-in, protected route redirect, and dashboard session handling on Cloudflare in week 1. |
| Adapter lock-in slows a later migration | Devil's advocate | L | M | Keep domain logic away from platform APIs; isolate Cloudflare-specific bindings at the boundary layer. |
| `compatibility_date` drift changes behavior unexpectedly | Unknown unknowns | M | M | Treat compatibility-date bumps as deliberate changes, test them in a dedicated deploy, and record why each bump happened. |
| Wrong Cloudflare deploy command family is used | Unknown unknowns | M | M | Standardize on `npx wrangler deploy` for this repo and document explicitly that this project is configured for Workers, not `wrangler pages deploy`. |
| Secrets are rotated or changed without coordinated app checks | Research finding | L | H | Rotate one secret at a time, verify auth immediately after rotation, and keep a known-good credential backup path in Supabase/Cloudflare dashboards. |
| Git-based preview workflow is assumed before it is configured | Research finding | M | M | Treat preview automation as optional follow-up work; rely on local preview plus controlled production deploys until Builds/PR previews are explicitly wired. |

## Getting Started

1. Keep the current adapter path. Do **not** switch to Netlify/Node/Vercel adapters; this repo is already configured with `@astrojs/cloudflare` in [astro.config.mjs](/c:/Users/PrzemyslawMucha/OneDrive%20-%20VIOTAS%20Limited/Desktop/10xdevs/Project/astro.config.mjs:1) and a Worker entrypoint in [wrangler.jsonc](/c:/Users/PrzemyslawMucha/OneDrive%20-%20VIOTAS%20Limited/Desktop/10xdevs/Project/wrangler.jsonc:1).
2. Add production secrets with `npx wrangler secret put SUPABASE_URL` and `npx wrangler secret put SUPABASE_KEY`.
3. Verify the app locally with `npm run build` and `npm run preview`; this matches the current project scripts and keeps the workflow aligned with Astro 6 + the Cloudflare adapter.
4. Publish with `npx wrangler deploy`. For this repo, use Workers deploy commands, not Pages deploy commands.
5. After first deploy, hit the auth flow manually and then tail logs with `npx wrangler tail` while testing protected routes and dashboard behavior.

## Out of Scope

The following were not evaluated in this research:

- Docker image configuration
- CI/CD pipeline setup
- Production-scale architecture (multi-region, HA, DR)
