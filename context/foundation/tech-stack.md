---
starter_id: 10x-astro-starter
package_manager: npm
project_name: a-smieci-wyniosles
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
---

## Why this stack

This is a small web app for a solo builder shipping an MVP in 3 weeks after hours, with authentication as a must-have from day one. The recommended JavaScript path fits best because it keeps frontend and backend in one opinionated stack, includes auth and database primitives early, and stays closer to existing React and JavaScript experience than a split Python backend plus separate frontend. Cloudflare Pages matches the starter's default deployment path, while GitHub Actions with auto-deploy on merge keeps delivery simple for a small greenfield project.
