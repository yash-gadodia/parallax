# Parallax

A Gen Z **couples app** (React Native + Expo): **the AI mediator that hears both sides.** After a fight each partner privately writes their own side; neither ever sees the other's raw words; the app returns one shared synthesis (common ground, what's underneath for each, one kind bridge each) and remembers what worked for next time. A 30-second no-typing daily **pulse** keeps that memory warm; a 24h **repair check-in** closes the loop. Three surfaces: Home, Refocus (the flow), Memory (the couple's record). Design source of truth: `design_handoff_parallax/`.

**v2.0 (Aug 2026) replaced v1's daily drop/hunch/wavelength game** — that loop, plus packs, journeys, streaks, wrapped and the money dates, was removed wholesale. Don't reintroduce them; see `docs/SUBMISSION_V2.md` and the plan in `.claude/`. Product laws that survived: never paywall the repair moment, one purchase covers both partners, partner-triggered notifications only, no scores on the relationship, never present demo data as the couple's own.

Read ARCHITECTURE.md before planning or structural changes. Claude auto-follows clarify → plan → implement → test → self-review, scaled to task size (you don't need to type `/plan` or `/test`).

## Commands
- **Install**: `npm install` (use `--legacy-peer-deps` if it errors — reanimated/worklets peer range)
- **Dev**: `npx expo start` (press `i` iOS sim, `a` Android) · **Bundle check**: `npx expo export -p ios`
- **Test**: `npm test` (jest) · **Watch**: `npm run test:watch` · **Typecheck**: `npm run typecheck`
- **Local backend**: `supabase start` → `supabase db reset` (applies migrations + seed) · **DB tests**: `supabase test db` (pgTAP)

## Stack
- **App**: Expo SDK 56, React Native 0.85, React 19, TypeScript, **Expo Router** (file-based, `app/`)
- **Backend**: **Supabase** (Postgres + Auth + Realtime); RLS is the privacy backbone. Raw vents never leave the server: `get_couple_context` (0048) feeds the mediator summaries only, and excludes private learnings
- **State**: Zustand (UI/local) + @tanstack/react-query + supabase-js; **Reanimated 4**, react-native-svg, expo-blur, MaskedView
- **Tests**: jest + jest-expo + @testing-library/react-native; pgTAP for SQL/RLS

## React Native fidelity (hard-won — see `.claude/rules/frontend.md`)
- `lineHeight` is **pixels**, never a CSS multiplier (`lineHeight: fontSize*1.4`, NOT `1.5`).
- Every `<Text>` needs its **own explicit `color`** — RN does not inherit color from parent Views.
- **Reuse the atoms** in `src/components` (Btn, Wordmark, Peek, Ring, GradientText, TabBar, Sheet…). Don't reimplement.
- Tokens from `src/design/tokens` + `typography`. Gradient text → `GradientText`; blur → expo-blur; icons → `Icon`.

## Supabase (see `.claude/rules/database.md`)
- All cross-partner writes go through SECURITY DEFINER Postgres functions; never trust the client. The gated mutual reveal (repair check-in) is enforced in RLS (pgTAP-proven).
- **Realtime needs the table in the `supabase_realtime` publication** or `postgres_changes` silently never fires (this broke pairing + the core loop for months; fixed in 0047). Adding a subscription means adding the table in the same migration.
- supabase-js typed `.rpc()`/`.update()` sometimes infers `never` — use a documented `// @ts-expect-error` (the codebase pattern), never `as any`.

## Conventions
- TypeScript everywhere; **no `any` / `@ts-ignore`** in source (one documented `@ts-expect-error` for the supabase quirk is OK).
- Keep it simple; match surrounding code; don't refactor unrelated code while fixing a bug; no comments unless they clarify non-obvious intent.

## Testing & Git
- Co-located `*.test.ts(x)`. Assert exact values (not ranges/truthiness). Tests must actually `render()` + assert — never `expect(<JSX/>).toBeTruthy()`. jest mocks live in `jest-setup.ts` (reanimated, safe-area, expo-router, supabase, AsyncStorage).
- Conventional Commits; small focused commits; only commit when asked.

## Working with Dani
When the user is Dani (non-technical product/design partner): explain simply, never ask her to run git/SQL/build commands — do it for her, prefer doing over explaining. Her guide is `WORKING_WITH_CLAUDE.md`; her lane vs Yash's is in `.claude/rules/backlog.md`.

## Workflow / Do NOT
- After 2 failed attempts, stop and rethink. **Verify before claiming done** (run it, show output) — `npm test` + `npm run typecheck` + `npx expo export`. Delegate verbose runs to subagents.
- **This repo is PUBLIC / open source — never commit credentials** (DB passwords, API keys, `service_role`/`sb_secret_…`, connection strings with passwords). Creds live only in `.env` (gitignored, local) or **EAS secrets** (prod builds). A hook blocks `.env`/keys; if a secret leaks, rotate it. Prod-backend setup: `docs/PROD_SETUP.md`.
- Don't `npm install` stray deps in fixes. Don't leave `ios/`/`android/` or `.env` uncommitted-but-tracked (gitignored).
