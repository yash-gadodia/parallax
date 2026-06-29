# Go-Live Checklist (Yash)

Parallax is **code-complete for v1** and runs as a single-player demo with zero setup. This is the ordered path to turn the demo into a real, shipped, two-player app. Each step says *what it unlocks*. Do them roughly top-to-bottom — earlier steps gate later ones.

Owner legend: most of this is **infra/creds (Yash)**; a few are one-time edits you can hand back to Claude.

**Status (29 Jun 2026):** prod Supabase + EAS build pipeline are live. Android builds working. **Apple Developer account (Individual) is now ACTIVATED** — iOS path unblocked. Next: switch App Store Connect to the personal team (NOT the Voltade org), generate an App Store Connect API key (`.p8` + Key ID + Issuer ID, Admin role) for hands-off EAS build+submit, create the app record (`com.yashgadodia.parallax`), then enable the Supabase Apple provider. Remaining hard blockers before submission: app icon (1024², none yet), screenshots, privacy/terms hosting + contact email. Google login: create a **Web** OAuth client in GCP project `parallax-500811` (redirect `…supabase.co/auth/v1/callback`) → enable the Supabase Google provider.

---

> 🚀 Build+ship runbook → **`docs/APP_DEPLOYMENT.md`**.  ·  📝 App Store submission playbook (privacy labels, reviewer demo, rejection defenses) → **`docs/SUBMISSION.md`**.

## 1. Identity & build pipeline (nothing ships without this)
- [x] Real iOS `bundleIdentifier` in `app.json` → `com.yashgadodia.parallax` (+ Android package).
- [x] `eas init` → EAS `projectId` linked (`@mcbebu/parallax`). *(Existing repo linked via `eas init --id`, not `create-expo-app`.)*
- [x] `.npmrc` (`legacy-peer-deps=true`) so EAS install matches local — without it builds die at install in ~20s.
- [x] **Android** build pipeline proven on EAS (keystore auto-generated in cloud, APK builds).
- [x] **Apple Developer account** (Individual) → **ACTIVATED (29 Jun)**. ⚠️ Switch App Store Connect to the personal team, NOT the Voltade Pte Ltd org (seller name/ownership/payouts attach to the team you build under).
- [ ] **App Store Connect API key** (Users & Access → Integrations → Keys → Admin) → `.p8` + Key ID + Issuer ID → wire EAS for hands-off build+submit.
- [ ] App Store Connect **app record** (`com.yashgadodia.parallax`) + **TestFlight**.
- [ ] (CI) Add `EXPO_TOKEN` as a repo secret for the `.github/workflows/` builds.

## 2. Production backend (turns the demo into the real app)
> 📘 Full step-by-step (region is permanent, IPv6→Session-pooler, EAS env wiring, **never-commit-creds** rules) → **`docs/PROD_SETUP.md`**.
- [x] Prod **Supabase** project — **region: Singapore / ap-southeast-1** (can't be changed later).
- [x] `supabase db push` (Session-pooler `--db-url`; direct host is IPv6-only) — migrations `0001`→`0011` + RLS verified on prod.
- [x] Auth redirect URL `parallax://auth-callback` added.
- [x] Prod URL + publishable key wired into **EAS env vars** (preview + production) — *not* committed (see `docs/CREDENTIALS.md`).
- [x] `refocus` **deployed** to prod (Anthropic-powered) with `verify_jwt = true` (unauth calls → 401). `notify-partner` pending push creds (§4).
- [x] Per-user **rate limit** on `refocus` — `claim_refocus_slot` (12/hr/user) caps Anthropic spend; null-uid/anon calls rejected. Migration `0012` + pgTAP.

## 3. Keys / providers
- [x] **Anthropic**: `ANTHROPIC_API_KEY` set as a Supabase secret + `refocus` deployed → **Refocus AI live in prod**.
- [ ] **RevenueCat**: public SDK keys (`appl_…`/`goog_…`) + products + the **"Parallax Pro"** entitlement. Set Pro pricing.
- [x] **Apple Sign In** (native flow): App ID `com.yashgadodia.parallax` + Sign in with Apple capability; **Supabase Apple provider enabled** (client_id = bundle ID, no secret) via Management API (29 Jun). Setup steps → `docs/APP_DEPLOYMENT.md`.
- [ ] **Google OAuth** client (GCP **Web** client, redirect `…supabase.co/auth/v1/callback`) → Supabase Google provider (`external_google_*`).
- [ ] **Resend**: verify the sending domain + set `RESEND_SMTP_PASSWORD` (prod confirmation emails).
- [ ] **Analytics** (optional): set `EXPO_PUBLIC_ANALYTICS_KEY` (PostHog) — no-ops until then.

## 4. Push notifications (the habit loop + retention)
- [~] **APNs `.p8` key** created (App ID has Push capability) — ⚠️ **scoped Sandbox-only; recreate as Sandbox+Production before TestFlight** (TestFlight/App Store use the Production APNs env). Then upload to EAS (`eas credentials` → iOS → Push Notifications Key) + add **FCM** for Android.
- [x] `projectId` passed to `getExpoPushTokenAsync` (standalone builds need it to mint a push token).
- [x] **OTA updates** (`expo-updates`) configured — ship JS-only fixes without a rebuild (`eas update --branch production`).

## 5. Recurring jobs
- [x] **`reset_stale_streaks()`** scheduled daily on prod (pg_cron `reset-stale-streaks-daily`, 00:00 SGT). Streaks now reset/forgive in prod.

## 5b. Assets needed for submission (design)
- [ ] **App icon** (1024×1024 PNG, no alpha) — `app.json` has none; build uses a placeholder. **Hard App Store requirement** → needs a real designed icon.
- [ ] **Screenshots** (6.7" + 6.5" iPhone) for the listing.

## 6. Compliance & safety (App Store will check)
- [~] **Privacy Policy + Terms of Service** — drafts in `docs/PRIVACY.md` + `docs/TERMS.md`; **need hosting** (a public URL) + a legal review before launch.
- [x] **Full account deletion** (App-Store-grade): `delete-account` edge fn runs `delete_my_account()` then `auth.admin.deleteUser` → erases the Supabase **Auth** record too. JWT-gated (unauth → 401), deployed to prod.
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
