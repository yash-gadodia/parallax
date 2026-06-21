# Testing

Stack: **jest** (^29) + **jest-expo** (^56) preset + **@testing-library/react-native** (v14) for JS/TS; **pgTAP** (`supabase test db`) for SQL/RLS. Tests are co-located `*.test.ts(x)`; run `npm test`, watch `npm run test:watch`.

## Rules
- **Exact assertions** — assert the exact expected value for known inputs (floats: `toBeCloseTo` with a specific value). Never assert just `> 0` / "truthy".
- **Tests must actually exercise the thing.** A `render()` + a real query/`fireEvent` (or `toJSON()` for a smoke test). NEVER `expect(<Component/>).toBeTruthy()` — a JSX literal is always truthy and tests nothing. This bug shipped repeatedly here; reject it in review.
- `render()` from RNTL v14 is **async** — `const { ... } = await render(<X/>)`. The matchers entrypoint is `@testing-library/react-native/matchers` (NOT `/extend-expect`).
- **Pure logic first** — `src/domain/*` (reveal scoring, mood, invite codes) is RN-free; unit-test it with exact values. Highest-ROI tests.
- **Descriptive names**, independent, deterministic (seed randomness). Behavior, not implementation.
- **No hollow/weak tests to make CI pass.** Don't `.skip`, don't revert a real render to a truthy stub, don't weaken an assertion.

## jest mocks (all in `jest-setup.ts` — global)
Native modules are mocked there so screens render in jest: `react-native-reanimated` (incl. `withRepeat`/`withSequence`/`Easing.inOut`), `react-native-safe-area-context`, `expo-router` (router/Link/Stack/Tabs), `@supabase/supabase-js` (chainable from/rpc/channel/auth returning empty), `@react-native-async-storage/async-storage`, and default `EXPO_PUBLIC_SUPABASE_*` env. If a new screen imports a native module that throws in jest, add its mock here — don't disable the test.

## pgTAP (RLS / reveal gate — security-critical)
- `supabase/tests/*.sql` run via `supabase test db`. They MUST be **hermetic**: create their own rows with unique `gen_random_uuid()` ids; never assert global catalog counts (the seed + dev data break those).
- Keep the **enforcement** assertions: a non-member and a pre-reveal partner read **0 rows** from `answers`/`couple_drops`; after both submit, the partner's answers become readable. Use valid pgTAP (`ok`/`is`/`isnt`/`throws_ok`); there is no `isnt_null`.
- Run against a clean DB: `supabase db reset && supabase test db`. A "FAIL" right after agent psql work is usually dirty state — reset first.

## Verify before "done"
`npm test` (green, **pristine** output — warnings are findings) + `npm run typecheck` (0, no new `any`) + `npx expo export -p ios` (bundles all routes). Don't claim passing without showing the run.
