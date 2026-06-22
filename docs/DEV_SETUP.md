# Dev Setup — running Parallax locally

A from-scratch guide to get the app running on your Mac. Aimed at a first-time clone. If something breaks, jump to [Troubleshooting](#troubleshooting).

## 1. Prerequisites

| Tool | Why | Install |
|---|---|---|
| **macOS (Apple Silicon)** | iOS builds | — |
| **Node 20+ LTS** | JS runtime / Expo | `brew install node` or nvm |
| **Xcode** + a simulator | iOS dev build | Mac App Store → open once → install a iPhone simulator |
| **Docker** (OrbStack recommended) | runs local Supabase | `brew install orbstack` |
| **Supabase CLI** | local Postgres/Auth/Realtime | `brew install supabase/tap/supabase` |
| **Watchman** (optional) | faster file watching | `brew install watchman` |

Check: `node -v` (≥20), `xcrun simctl list devices | grep Booted` (after opening a sim), `docker ps` (daemon up), `supabase --version`.

## 2. Install JS dependencies

```bash
npm install --legacy-peer-deps
```

> **The `--legacy-peer-deps` flag is required**, not optional — `react-native-reanimated`/`react-native-worklets` declare a peer range npm's strict resolver rejects. Plain `npm install` will error.

## 3. Environment

```bash
cp .env.example .env
```

`.env` needs two public values (anon key is safe in the client — RLS is the security backbone):

```
EXPO_PUBLIC_SUPABASE_URL=http://<your-LAN-IP>:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key from `supabase start`>
```

- Use your Mac's **LAN IP** (e.g. `192.168.x.x`), not `localhost`, so a physical phone on the same Wi-Fi can reach it. The iOS simulator accepts the LAN IP too. Find it: `ipconfig getifaddr en0`.
- RevenueCat keys (`EXPO_PUBLIC_REVENUECAT_*`) are optional locally — payments fall back to a graceful no-op outside a real build.

## 4. Backend (local Supabase)

```bash
supabase start          # boots Postgres + Auth + Realtime + Studio in Docker
supabase db reset       # applies migrations 0001..0005 + seed.sql (wipes local data)
```

`supabase start` prints the **API URL**, **anon key**, and **service_role key** — copy the first two into `.env`. Useful local URLs:

- **Studio** (DB browser): http://127.0.0.1:54323
- **Mailpit** (catches all outgoing email, incl. signup confirmations): http://127.0.0.1:54324

Seed a pre-confirmed user so you can sign in without the email step:

```bash
./scripts/seed-test-user.sh        # → test@parallax.app / parallax123
```

## 5. Run the app

```bash
npm run ios        # prebuilds (if needed), compiles the native dev client, installs & launches on the booted sim
```

First build takes a few minutes (compiles native pods incl. RevenueCat). Subsequent runs are incremental. JS changes hot-reload via Metro; **native/route-layout changes need a full reload** (shake → Reload) or a rebuild.

To target a specific simulator: `npm run ios -- --device "iPhone 17 Pro Max"`.

## 6. Verify your setup

```bash
npm run typecheck          # → 0 errors
npm test                   # → all suites green
npx expo export -p ios     # → bundles every route (catches route/import breaks)
supabase test db           # → pgTAP RLS + reveal-gate tests pass
```

If all four are green, you're set.

## Testing the flows by hand

- **Skip signup:** Welcome → "I already have an account" → `test@parallax.app` / `parallax123`.
- **Real signup + confirmation:** create an account in-app → open **Mailpit** (http://127.0.0.1:54324) → click the confirmation link (it deep-links back into the app via `parallax://auth-callback`).
- **Whole daily loop solo:** the app has a demo/SIM mode — `sim_partner_submit` stands in for a partner, so you can create a couple and complete a full reveal alone.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `npm install` peer-dep error | use `npm install --legacy-peer-deps` |
| App can't reach Supabase / network errors / **sign-in fails or times out** | Two common causes on the **simulator**: (1) use `http://127.0.0.1:54321` as the URL — the sim reaches the Mac via loopback, the LAN IP is only for a physical phone (and goes stale between networks); (2) the **anon key in `.env` must match `supabase status`** — it drifts if the local stack is recreated. Fix both, then **restart Metro with `--clear`** and relaunch the app (env vars are bundled at Metro start). |
| `supabase test db` shows FAIL right after manual psql/agent work | local DB is dirty → `supabase db reset` first, then re-run. |
| Reload shows stale JS in the sim | Expo caches the bundle — shake → Reload, or rebuild. Verify route/layout changes with `npx expo export`. |
| Port 8081 already in use | a Metro server is already running; reuse it, or kill it and re-run. |
| Native build fails after a dep change | `cd ios && pod install` (or delete `ios/` and let `npm run ios` prebuild), then rebuild. |
| Text invisible / clipped | RN `lineHeight` is **pixels** not a multiplier, and every `<Text>` needs its own `color`. See `.claude/rules/frontend.md`. |
| Confirmation email never arrives locally | it won't be sent via real SMTP locally — check **Mailpit**. |
