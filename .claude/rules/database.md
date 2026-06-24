---
paths: ["supabase/**", "src/lib/supabase.ts", "src/types/db.ts", "src/features/**"]
---

# Supabase / data layer

Backend is Supabase (Postgres + Auth + Realtime). Migrations `supabase/migrations/0001..0006`; the typed client is `src/lib/supabase.ts`; hand-written types in `src/types/db.ts`.

> Local dev runs on **colima**, not OrbStack. `supabase start` fails on the `vector` log container (colima can't mount its docker.sock) → start with `supabase start -x vector,analytics --ignore-health-check`, then `supabase db reset` + `supabase test db`.

## RLS is the security backbone (don't bypass)
- Every intimate table carries `couple_id`; policy = "current user is a member of this couple."
- **The reveal gate** (the core security property): a member can read the partner's `answers` ONLY when `couple_drops.state = 'revealed'` (both submitted). Enforced in RLS — never in the client. **Proven by `supabase/tests/rls_enforcement_test.sql`** — it switches into the `authenticated` role + sets `request.jwt.claims` and asserts real row counts (the `reveal_gate_*.sql` files only check that policies *exist*, running as the RLS-exempt owner). Keep the enforcement test green.
- **Grants are NOT automatic.** This Postgres' default privileges grant `authenticated` only `Dxt`, NOT DML — a new table is invisible to logged-in users until you `grant select,insert,update,delete ... to authenticated` (see `0006_harden.sql`). RLS still gates rows. Every new migration adding a table MUST grant itself or the live app gets "permission denied".
- **All cross-partner writes go through SECURITY DEFINER functions** (`create_couple`, `join_couple`, `submit_answers`, `sim_partner_submit`, `complete_streak`, `log_activity`, `nudge_partner`, `add_learning`, `ensure_today_drop`) — clients call them via `supabase.rpc(...)`, never raw table writes for cross-partner data.
- `service_role` / secrets never ship in the client — only `EXPO_PUBLIC_SUPABASE_URL` + anon key (`.env`, gitignored).

## Migrations & local dev
- New schema → a new `00NN_*.sql` migration, **idempotent** (`if not exists`, `on conflict do nothing`); apply non-destructively with `supabase migration up` to preserve local dev data. Use `supabase db reset` only for a clean verify (it wipes data + re-seeds — the user must re-sign-up).
- After agent psql verification, the local DB is dirty → `supabase db reset` before trusting `supabase test db`.

## supabase-js typing
- Typed `.rpc()` / `.update()` sometimes infers args as `never` (a known supabase-js limitation with the generated `Database` generic). Use a single documented `// @ts-expect-error supabase-js typed ... resolves to never` — this is the established codebase pattern. **Never `as any`.**
- Add new RPCs to `Database['public']['Functions']` and new tables to `Tables` in `src/types/db.ts`.

## Demo / solo mode
The daily loop is solo-testable: `sim_partner_submit` stands in for a real partner (auto-creates a demo "Dani" member_b) so a reveal completes alone. Feature hooks fall back to local Zustand/sample data when there's no session, so the un-authenticated demo never crashes. Mark any such stand-in with a `// SIM:` / `// GATE:` comment.

## Gated (UI built, not live — need creds)
Refocus AI (Anthropic edge fn), payments (RevenueCat), push (EAS + APNs/FCM), home widget (native). Build to the gate behind a labeled stub; don't fake a live transaction.
