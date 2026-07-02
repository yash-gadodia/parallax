# Backlog

The shared task list. Plain-English, owner-tagged, and the Claude agent reads & updates it.

**How it works**
- Each task is a checkbox with an **owner**: `(Yash)` creds/infra · `(Dani)` product/design calls · `(Claude)` anything the agent can build.
- Say **"work on the backlog"** and Claude picks the top unblocked **(Claude)** item, does it (test + verify), then checks it off and moves it to **Done** with the commit.
- Claude can also **assign** (add a task with the right owner) and **reassign** (e.g. if a (Claude) task actually needs a cred → tag it (Yash) and note why).
- Add anything you want in plain words under **To do** — Claude will route it to the right owner.

---

## To do

### (Yash) — go-live credentials & infra  _(for later; full steps in docs/HANDOFF.md)_
- [ ] **(Yash)** Real iOS `bundleIdentifier` in `app.json` (replace `com.anonymous.parallax`)
- [ ] **(Yash)** Expo: run `npx eas init`, add `EXPO_TOKEN` repo secret (unlocks CI builds + OTA)
- [ ] **(Yash)** Production Supabase project: link + push migrations + set auth redirect URLs (`parallax://auth-callback`)
- [ ] **(Yash)** Apple Developer account → App Store Connect app + "Sign in with Apple" provider creds in Supabase
- [ ] **(Yash)** Google OAuth client → Supabase Google provider
- [ ] **(Yash)** Anthropic key → `supabase secrets set ANTHROPIC_API_KEY` (powers Refocus AI) + add rate-limit for prod
- [ ] **(Yash)** RevenueCat public SDK keys (`appl_…`/`goog_…`) + products + "Parallax Pro" entitlement
- [ ] **(Yash)** Resend: verify the Parallax sending domain + set `RESEND_SMTP_PASSWORD` (prod confirmation emails)
- [ ] **(Yash)** Set **Pro pricing** (Lifetime / Yearly / Monthly) — gates the RevenueCat product setup
- [ ] **(Yash)** Privacy Policy + Terms of Service URLs (App Store requires a privacy policy; couples data is sensitive)
- [ ] **(Yash)** App Store Connect: create the app record + enable **TestFlight** for the beta
- [ ] **(Yash)** Cost monitoring/budgets for Anthropic + Supabase + EAS (so spend doesn't surprise)
- [ ] **(Yash)** Set up a **staging environment** (separate Supabase project + EAS `preview` channel) to test before prod
- [ ] **(Yash)** Schedule `reset_stale_streaks()` to run **daily** (pg_cron or a scheduled edge function) — built + tested in `0007_streak_reset.sql`, but the shared streak won't reset/forgive in prod until something calls it once a day
- [ ] **(Yash)** Before prod, gate the demo `sim_partner_submit` RPC out (or behind a flag) — it lets a user self-reveal solo; it's the intended local demo mechanism but shouldn't ship enabled to real users
- [ ] **(Yash)** Refocus edge fn hardening for prod: set `verify_jwt = true` (config.toml) + add a per-user/IP rate limit (it currently spends Anthropic tokens on anonymous calls)
- [x] **(Yash/Claude)** ~~Retire `phase-0-foundation`~~ — done: branch deleted, `main` is the sole branch + default; its unique research docs were preserved on `main`.
- [~] **(Yash)** EAS push creds so notifications actually fire on device. **Done:** `projectId` in `app.json` + passed to `getExpoPushTokenAsync`; token now registered on every authenticated launch + SIGNED_IN (not just onboarding); `notify-partner` deployed; `played`/`revealed`/`paired` pushes wired (`ded6931`); iOS APNs key set (Sandbox+Prod, per GO_LIVE). **Remaining (Yash):** (1) Android **FCM** key in EAS; (2) cut a **new TestFlight build** — current build 1.0.0(5) predates the client push wiring, so delivery starts with the next build. (Daily *local* nudges already work.)
- [ ] **(Yash)** Full auth-user deletion: `delete_my_account()` removes the user's profile/answers + dissolves the couple, but the Supabase **Auth** record needs a `service_role` admin step (an edge function) to be fully erased. Add that for complete App-Store-grade deletion.
- [x] **(Claude)** Deploy the `notify-partner` edge fn + `verify_jwt=true` — **DONE** (prod, ACTIVE v1, 2026-06-29; paired-path smoke-tested live `{sent:0}` + 400 on bad params) (`ded6931`)
- [ ] **(Yash)** Turn on analytics: set `EXPO_PUBLIC_ANALYTICS_KEY` (PostHog project key) + optional `EXPO_PUBLIC_ANALYTICS_HOST`. Until then it no-ops. (To use Sentry instead, adapt `sendEvent` in `src/lib/analytics.ts` — ~20 lines.)
- [ ] **(Yash)** Universal (https) invite links: host `apple-app-site-association`, add `associatedDomains: ["applinks:yourdomain"]` to `app.json`, swap the share URL to https. (Custom `parallax://` links already work in standalone builds.)
- [ ] **(Dani/Yash)** Dynamic-type / font-scaling a11y: the app uses `allowFontScaling={false}` for fidelity — a future pass to respect user text-size needs a scaled-token decision.

### (Dani) — onboarding, product & design decisions
- [ ] **(Dani)** Review `docs/COMPETITIVE_PAIRED.md` — Paired teardown + R1–R7 gap-closing roadmap. Your calls especially: **R1** (content library — mostly editorial) and **R3** (how far to demote the "wavelength %" score)
- [ ] **(Dani)** Get set up locally + learn the stack — start with `WORKING_WITH_CLAUDE.md`, then `docs/DEV_SETUP.md` (run `npm run dev`), and skim `docs/FLOWS.md` for how the app works
- [ ] **(Dani)** Decide: ship the **Wrapped** feature, or cut it?
- [ ] **(Dani)** Decide: add **therapist escalation** in Refocus (offer a real couples therapist after repeated conflicts)?
- [ ] **(Dani)** Review the daily **prompt quality** / write new prompt packs (the "voice" lives in `src/content/`)
- [ ] **(Dani)** App Store **listing copy**: app name, subtitle, description, keywords, category
- [ ] **(Dani)** App Store **screenshots** + a short preview (Claude can generate them from the simulator on request)
- [ ] **(Dani)** Review the **Refocus AI voice** + onboarding/notification copy (tone check)
- [ ] **(Dani)** Recruit a few **beta couples** to test via TestFlight

### (Claude) — buildable now

_From the 2026-07-02 E2E pass — details in `docs/E2E_FINDINGS_2026-07-02.md`._

- [x] **(Claude)** F2: sim call removed from `submitMyAnswers`; server (`0014_true_loop.sql` submit_answers) now owns reveal + wave_pct + streak; sim revoked in-migration, re-granted local-only via seed.sql (`d96c5df`)
- [x] **(Claude)** F3: Today hydrates from the server via new `get_today_state` RPC + `useTodayState` (realtime) — relaunch-safe, no replay/clobber (`d96c5df`)
- [x] **(Claude)** F4: day boundary is couple-local (`couples.tz`, default Asia/Singapore) across ensure_today_drop / streak / reset (`d96c5df`)
- [x] **(Claude)** F6: transition lock in play.tsx — taps during the 360ms phase advance are ignored
- [x] **(Claude)** F7: act() warnings eliminated (signup: direct onChangeText inside one act; wrapped: fake timers) — full suite 0 warnings
- [ ] **(Claude)** Android fidelity pass once iOS is solid: `eas build -p android` works from the same codebase; needs shadows→elevation, blur + font/lineHeight checks per screen (first preview APK built 2026-07-02).
- [~] **(Claude)** F1: reanimated 4.3.1→4.5.0 + worklets 0.10.1 committed AND shipped — EAS production build `a64c5ec5` (2026-07-02) submitted to TestFlight with the fix + push wiring. REMAINING (Yash): crash-soak the TestFlight build on the waiting screen to confirm the SIGSEGV is gone.

### (Yash) — from the 2026-07-02 build-all sprint (code done, needs your keys/actions)
- [ ] **(Yash)** Wire an HOURLY cron invoking the `scheduled-pushes` + `email-reengage` edge fns with the service-role bearer (streak-saver ~10pm couple-local, ritual-drift reminder, 3-day-silent email; server-side claim ledger makes reruns safe). Steps + rationale in the `0023_scheduled_pushes.sql` header.
- [ ] **(Yash)** Set `RESEND_API_KEY` (+ optional `RESEND_FROM`) as function secrets — until then `email-reengage` no-ops with a clear log line.
- [ ] **(Yash)** Deploy the sprint to prod when ready: `supabase db push` (0020–0025) + deploy edge fns `scheduled-pushes`, `email-reengage`, updated `notify-partner` / `generate-drops` / `refocus`. Verified locally: clean `db reset` + full pgTAP 22 files / 295 tests PASS.
- [ ] **(Yash)** Next TestFlight build picks up the native additions (react-native-view-shot for the 9:16 share image, widget risk state) — no EAS run from Claude without your go-ahead.

### (Dani) — from the E2E pass
- [ ] **(Dani)** F5: today's drop is hardcoded ("DROP 27 · soft launch", fake archive) — decide the real daily-content rotation (ties into the existing prompt-packs item + IMPROVEMENT_PLAN Phase 1). The day label now shows the real weekday (fixed).

## In progress

_(nothing right now)_

## Done
- [x] **(Claude)** **2026-07-02 build-all sprint — every remaining Claude-buildable IMPROVEMENT_PLAN item** (`d77f95b`..`30b2679`, on top of the parallel session's P4 `473d258`): 4.5 fake surfaces killed (homeScreen 83% mock deleted, gallery out, photo stub gone) · 3.4 streak grace (24h catch-up at 80% + streak repair, weekly freeze earn-back/refund, post-reveal submit immutability — 0022, 25 pgTAP) · 1.5+2.3 reveal payload (mutual-read 🔥 escalation, biggest-miss conversation spark, D2 twin beat, D3 widget ask) · 1.3 intent-weighted rotation + 1.4 became_prompt_id flywheel + 5.3 send_pack/repair_streak (0024, 12 pgTAP) · 3.2 streak-saver + drift pushes with claim ledger + honest reveal copy + 3.8 Resend re-engagement (0023, 31 pgTAP) · 5.1–5.4 honest monetization (one paywall, lifetime $79.99, real pack samples/sends, paywall-moments law) · 2.2 invite expiry + regenerate + 24/72h pending reminders · 0.4 dropDetail renders the real drop (0025, 9 pgTAP) · 2.5 couple_created/first_mutual_reveal events · 3.5d widget streak-at-risk (TS+Swift) · 3.7 practice round · 6.1 real 9:16 share image. Gates: tsc 0 · jest 92 suites/671 tests pristine · expo export ✓ · clean-reset pgTAP 22/295 ✓.
- [x] **(Claude)** IMPROVEMENT_PLAN P0 complete + deployed to prod (migrations 0014-0017, refocus + notify-partner edge fns): server-driven reveal/wave/streak, couple-local days, honest states everywhere, solo Refocus, auth dead-ends, fabricated signals removed (`d96c5df`..`e573cdb`)
- [x] **(Claude)** 90-drop/270-prompt rotating content catalog live on prod (0015) — spice-aware, no repeats (`8d31f07`)
- [x] **(Claude)** nudge push + 1/day rate limit (0016), notify-partner actor fix, real streak surface + milestone events (0017), honest share card + real Wrapped (`e573cdb`)
- [x] **(Claude)** Fix `select_partner_profile` RLS — unqualified `id` in the couples subquery shadowed `profiles.id` (bound to `couples.id`), so the partner check was always false and a member could never read their partner's `display_name` (app fell back to hardcoded "Dani"). `0013_fix_partner_profile_rls.sql` + `partner_profile_test.sql` pgTAP (full suite 112 ✓), pushed to prod & **verified live** (review account now reads partner "Sam") (`37b80b3`)
- [x] **(Claude)** Email/password signup + email confirmation (Resend) with Apple/Google
- [x] **(Claude)** Realtime crash fix (unique channel topics) — verified on device
- [x] **(Claude)** Go-live signup flow verified end-to-end + root redirect guard
- [x] **(Claude)** Full unit-test coverage (222 tests) + handoff docs
- [x] **(Claude)** Core-screen design fidelity (logo/mascot bounce, us-soft colors)
- [x] **(Claude)** Remaining-screen fidelity pass: pay screens already matched; fixed onboarding chip padding + invite-code spacing, streak us-soft card, milestone avatar overlap
- [x] **(Claude)** Minor polish: streak day-cells / progress-bar / milestone-icons now use the `us` gradient; wrapped share-card blur softened
- [x] **(Claude)** DX: doctor/dev scripts, CI + CD (EAS build/submit + OTA), hooks, error boundary
- [x] **(Claude)** Deep-audit fixes batch 1 — core loop: `done` flag wired (Today reveal card reachable), per-prompt threads, dedup refocus learnings, useActivity realtime crash, 50-day milestone copy (`cbe4434`)
- [x] **(Claude)** Deep-audit fixes batch 2 — security: fixed latent `authenticated` grant bug (every logged-in query was failing), dropped the couples tamper UPDATE policy, validated `submit_answers` inputs, idempotent `add_learning`, and **proved the reveal gate** with real role-impersonation pgTAP (`e055954`)
- [x] **(Claude)** Deep-audit fixes batch 3 — account: Log out, Restore Purchases (App Store req), RevenueCat-driven Plus state, valid 24h `notify_time` (`21a759f`)
- [x] **(Claude)** Deep-audit fixes batch 4 — streak: gap-aware increment + `reset_stale_streaks()` (freeze forgiveness then reset), pgTAP-proven (`54cd3d2`)
- [x] **(Claude)** Async reveal wired to server (`fetchReveal` + real `useDropState`, coupleDropId threaded; demo path intact) (`89b568e`, `488f708`)
- [x] **(Claude)** Real identity via `useProfile` (name/partner/spice across profile/editProfile/us/manageSub); Edit Profile persists (`6dd9b0c`)
- [x] **(Claude)** Real Unpair RPC + wired (`7d9c243`); Spice persists + gates content (`45acc51`)
- [x] **(Claude)** Onboarding: intents persisted pre-auth + real couple-join gate (`16c6d70`)
- [x] **(Claude)** UI/UX polish passes — daily-loop, us-cluster, entry/account vs design; review fixes (`9f83d17`, `5f9accb`, `87f6e60`, `9e6f6d9`)
- [x] **(Claude)** Push notifications (build-to-gate): expo-notifications, daily local nudge at notify_time, push-token register (`246a12d`)
- [x] **(Claude)** Offline submit-queue — failed submits enqueue + auto-flush on launch (`f341857`)
- [x] **(Claude)** Account deletion + data export (App Store req): `delete_my_account` RPC + export sheet; null-member reveal-gate fix (`a143c63`, `9b144ef`)
- [x] **(Claude)** Partner-played / reveal-ready push: `notify-partner` edge fn + client invoke, build-to-gate (`bc6b5ce`)
- [x] **(Claude)** Invite deep-links: `parallax://join?code=` parsed + prefilled into join-by-code, survives sign-up (`82a5920`)
- [x] **(Claude)** Analytics + crash scaffold: provider-agnostic, no-ops without a key, 9 funnel events + error-boundary capture (`66ba16d`)
- [x] **(Claude)** Accessibility pass: roles/labels/state/hitSlop on atoms + core daily-loop screens (`d218f04`)
