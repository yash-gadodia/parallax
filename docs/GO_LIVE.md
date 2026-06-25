# Go-Live Checklist (Yash)

Parallax is **code-complete for v1** and runs as a single-player demo with zero setup. This is the ordered path to turn the demo into a real, shipped, two-player app. Each step says *what it unlocks*. Do them roughly top-to-bottom — earlier steps gate later ones.

Owner legend: most of this is **infra/creds (Yash)**; a few are one-time edits you can hand back to Claude.

---

## 1. Identity & build pipeline (nothing ships without this)
- [ ] Set a real iOS `bundleIdentifier` in `app.json` (replace `com.anonymous.parallax`).
- [ ] `npx eas init` → adds the EAS `projectId` to `app.json`. *Unlocks real push tokens + builds.*
- [ ] Add `EXPO_TOKEN` as a repo secret (the CI/CD workflows in `.github/workflows/` use it).
- [ ] Apple Developer account → App Store Connect app record → enable **TestFlight**. *Unlocks the beta.*

## 2. Production backend (turns the demo into the real app)
- [ ] Create a prod **Supabase** project. `supabase link` to it.
- [ ] `supabase db push` to apply migrations `0001`→`0011`.
- [ ] Set the auth redirect URL: `parallax://auth-callback`.
- [ ] `supabase functions deploy refocus` and `supabase functions deploy notify-partner`.
- [ ] In `supabase/config.toml`, set `verify_jwt = true` for both functions (prod hardening) + add a per-user/IP rate limit on `refocus` (it spends Anthropic tokens).
- [ ] Put the prod URL + anon key in the app's env (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).

## 3. Keys / providers
- [ ] **Anthropic**: `supabase secrets set ANTHROPIC_API_KEY=...` (powers Refocus AI; falls back to the scripted exemplar without it).
- [ ] **RevenueCat**: public SDK keys (`appl_…`/`goog_…`) + products + the **"Parallax Pro"** entitlement. Set Pro pricing (annual/monthly).
- [ ] **Google OAuth** client → Supabase Google provider. **Apple Sign In** creds → Supabase Apple provider.
- [ ] **Resend**: verify the sending domain + set `RESEND_SMTP_PASSWORD` (prod confirmation emails).
- [ ] **Analytics** (optional but recommended for beta): set `EXPO_PUBLIC_ANALYTICS_KEY` (PostHog) — it no-ops until then.

## 4. Push notifications (the habit loop + retention)
- [ ] In EAS, add **APNs** (iOS) and **FCM** (Android) credentials (`eas credentials`).
- [ ] (If you didn't in `eas init`) pass the `projectId` to `getExpoPushTokenAsync` in `src/features/notifications/index.ts`.
- [ ] Once set: daily local nudges fire on permission grant; the `notify-partner` edge fn delivers "your turn" / "reveal ready" on every submit.

## 5. Recurring jobs
- [ ] Schedule **`reset_stale_streaks()`** daily (Supabase pg_cron or a scheduled edge function). Built + tested; the shared streak won't reset/forgive in prod until something calls it once a day.

## 6. Compliance & safety (App Store will check)
- [ ] **Privacy Policy + Terms of Service** URLs (couples data is sensitive — a privacy policy is mandatory).
- [ ] **Full account deletion**: `delete_my_account()` erases profile/answers + dissolves the couple; add a `service_role` edge step to also delete the Supabase **Auth** record for complete deletion.
- [ ] Cost budgets/alerts for Anthropic + Supabase + EAS.

## 7. Nice-to-have before public launch
- [ ] **Staging env**: a separate Supabase project + EAS `preview` channel to test before prod.
- [ ] **Universal (https) invite links**: host `apple-app-site-association`, add `associatedDomains: ["applinks:yourdomain"]` to `app.json`, swap the share URL to https. (`parallax://` custom links already work in standalone builds.)
- [ ] Gate the demo `sim_partner_submit` RPC out of prod (or behind a flag) — it lets a user self-reveal solo.

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
The entire app surface, the secure async two-player loop (RLS reveal-gate proven), accounts (sign-out / restore / delete / export), streaks, notifications (build-to-gate), offline-queue, deep-links, analytics scaffold, and an accessibility pass. See `docs/BACKLOG.md` → Done.
