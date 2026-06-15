# Auth Footer Link

- `change_id`: `2026-06-14-auth-footer-link`
- `date`: `2026-06-14`
- `scope`: `auth UI`
- `summary`: `Dodanie wspólnego komponentu linku w stopce auth i podmiana duplikacji na stronach sign in / sign up.`

## Operational Notes

- `operation_time`: `~8 min`
- `iterations`: `4`
- `convention_hit`: `yes`

## Evidence

- Komponent dodany w `src/components/auth/AuthFooterLink.astro`.
- Użyto `cn()` z `src/lib/utils.ts`.
- Strony `src/pages/auth/signin.astro` i `src/pages/auth/signup.astro` zostały przepięte na wspólny komponent.
- `npm run build` przeszedł.
- `npm run lint` nie przeszedł z powodu wcześniejszych, repo-wide błędów formatowania i ESLint, niezwiązanych z tą zmianą.
