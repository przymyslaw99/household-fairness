# Auth Message Card

- `change_id`: `2026-06-14-auth-message-card`
- `date`: `2026-06-14`
- `scope`: `auth UI`
- `summary`: `Dodanie wspólnego komponentu komunikatu auth i podmiana duplikacji na stronie confirm-email.`

## Operational Notes

- `operation_time`: `~6 min`
- `iterations`: `5`
- `convention_hit`: `yes`

## Evidence

- Komponent dodany w `src/components/auth/AuthMessageCard.astro`.
- Użyto `cn()` z `src/lib/utils.ts`.
- Strona `src/pages/auth/confirm-email.astro` została przepięta na wspólny komponent.
- `npm run build` przeszedł.
- `npm run lint` nie przeszedł z powodu wcześniejszych, repo-wide błędów formatowania i ESLint, niezwiązanych z tą zmianą.
