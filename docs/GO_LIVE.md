# Go-Live Checklist (Yash)

Parallax is **code-complete for v1** and runs as a single-player demo with zero setup. This is the ordered path to turn the demo into a real, shipped, two-player app. Each step says *what it unlocks*. Do them roughly top-to-bottom — earlier steps gate later ones.

Owner legend: most of this is **infra/creds (Yash)**; a few are one-time edits you can hand back to Claude.

**Status (28 Jun 2026):** prod Supabase + EAS build pipeline are live. Android builds working; iOS waiting on Apple Developer activation.

---

> 🚀 Full build+ship runbook (EAS, the `.npmrc` gotcha, Individual-vs-org, API key) → **`docs/APP_DEPLOYMENT.md`**.

## 1. Identity & build pipeline (nothing ships without this)
- [x] Real iOS `bundleIdentifier` in `app.json` → `com.yashgadodia.parallax` (+ Android package).
- [x] `eas init` → EAS `projectId` linked (`@mcbebu/parallax`). *(Existing repo linked via `eas init --id`, not `create-expo-app`.)*
- [x] `.npmrc` (`legacy-peer-deps=true`) so EAS install matches local — without it builds die at install in ~20s.
- [x] **Android** build pipeline proven on EAS (keystore auto-generated in cloud, APK builds).
- [ ] **Apple Developer account** (Individual) → **in progress** (enrolled 28 Jun, awaiting activation). Then App Store Connect app record + **TestFlight**.
- [ ] (CI) Add `EXPO_TOKEN` as a repo secret for the `.github/workflows/` builds.

## 2. Production backend (turns the demo into the real app)
> 📘 Full step-by-step (region is permanent, IPv6→Session-pooler, EAS env wiring, **never-commit-creds** rules) → **`docs/PROD_SETUP.md`**.
- [x] Prod **Supabase** project — **region: Singapore / ap-southeast-1** (can't be changed later).
- [x] `supabase db push` (Session-pooler `--db-url`; direct host is IPv6-only) — migrations `0001`→`0011` + RLS verified on prod.
- [x] Auth redirect URL `parallax://auth-callback` added.
- [x] Prod URL + publishable key wired into **EAS env vars** (preview + production) — *not* committed (see `docs/CREDENTIALS.md`).
- [x] `refocus` **deployed** to prod (Anthropic-powered) with `verify_jwt = true` (unauth calls → 401). `notify-partner` pending push creds (§4).
- [ ] Add a per-user/IP **rate limit** on `refocus` (verify_jwt blocks no-auth, but a valid anon key could still call → token spend).

## 3. Keys / providers
- [x] **Anthropic**: `ANTHROPIC_API_KEY` set as a Supabase secret + `refocus` deployed → **Refocus AI live in prod**.
- [ ] **RevenueCat**: public SDK keys (`appl_…`/`goog_…`) + products + the **"Parallax Pro"** entitlement. Set Pro pricing.
- [ ] **Google OAuth** client → Supabase Google provider. **Apple Sign In** creds → Supabase Apple provider.
- [ ] **Resend**: verify the sending domain + set `RESEND_SMTP_PASSWORD` (prod confirmation emails).
- [ ] **Analytics** (optional): set `EXPO_PUBLIC_ANALYTICS_KEY` (PostHog) — no-ops until then.

## 4. Push notifications (the habit loop + retention)
- [ ] In EAS, add **APNs** (iOS) and **FCM** (Android) credentials (`eas credentials`).
- [ ] (If not done by `eas init`) pass the `projectId` to `getExpoPushTokenAsync` in `src/features/notifications/index.ts`.
- [x] **OTA updates** (`expo-updates`) configured — ship JS-only fixes without a rebuild (`eas update --branch production`).

## 5. Recurring jobs
- [x] **`reset_stale_streaks()`** scheduled daily on prod (pg_cron `reset-stale-streaks-daily`, 00:00 SGT). Streaks now reset/forgive in prod.

## 6. Compliance & safety (App Store will check)
- [~] **Privacy Policy + Terms of Service** — drafts in `docs/PRIVACY.md` + `docs/TERMS.md`; **need hosting** (a public URL) + a legal review before launch.
- [ ] **Full account deletion**: `delete_my_account()` erases profile/answers + dissolves the couple; add a `service_role` edge step to also delete the Supabase **Auth** record for complete deletion.
- [ ] Cost budgets/alerts for Anthropic + Supabase + EAS.

## 7. Nice-to-have before public launch
- [ ] **Staging env**: a separate Supabase project + EAS `preview` channel to test before prod.
- [ ] **Universal (https) invite links**: host `apple-app-site-association`, add `associatedDomains` to `app.json`, swap the share URL to https. (`parallax://` custom links already work in standalone builds.)
- [x] Gate the demo `sim_partner_submit` RPC out of prod — `EXECUTE` revoked from `authenticated`/`anon` on prod (local demo still works).

---

### Verify locally any time
```bash
npm install --legacy-peer-deps
npm run typecheck            # 0 errors
npx jest --ci                # all green
npx expo export -p ios       # bundles
# DB (needs Docker/colima): supabase start -x vector,analytics --ignore-health-check
supabase db reset && supabase test db   # pgTAP
```

### What's already done (Claude)
The entire app surface, the secure async two-player loop (RLS reveal-gate proven), accounts (sign-out / restore / delete / export), streaks, notifications (build-to-gate), offline-queue, deep-links, analytics scaffold, accessibility pass — **plus**: prod Supabase (Singapore) + migrations, EAS build pipeline (Android proven), env vars, streak cron, prod RPC hardening, OTA updates. See `docs/BACKLOG.md` → Done.
