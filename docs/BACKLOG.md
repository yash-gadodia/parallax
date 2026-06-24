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
- [ ] **(Yash)** Retire `phase-0-foundation`: `main` is now the complete superset (its only unique non-stale files — STRATEGY.md + research reports — were ported in `fce36df`). On GitHub: change the **default branch to `main`** (Settings → Branches), retarget/close any open PRs, then delete `phase-0-foundation`. (Couldn't do it here — `gh` is unauthenticated and GitHub blocks deleting the current default branch.)

### (Dani) — onboarding, product & design decisions
- [ ] **(Dani)** Get set up locally + learn the stack — start with `WORKING_WITH_CLAUDE.md`, then `docs/DEV_SETUP.md` (run `npm run dev`), and skim `docs/FLOWS.md` for how the app works
- [ ] **(Dani)** Decide: ship the **Wrapped** feature, or cut it?
- [ ] **(Dani)** Decide: add **therapist escalation** in Refocus (offer a real couples therapist after repeated conflicts)?
- [ ] **(Dani)** Review the daily **prompt quality** / write new prompt packs (the "voice" lives in `src/content/`)
- [ ] **(Dani)** App Store **listing copy**: app name, subtitle, description, keywords, category
- [ ] **(Dani)** App Store **screenshots** + a short preview (Claude can generate them from the simulator on request)
- [ ] **(Dani)** Review the **Refocus AI voice** + onboarding/notification copy (tone check)
- [ ] **(Dani)** Recruit a few **beta couples** to test via TestFlight

### (Claude) — buildable now
_(from the deep audit, 2026-06-24 — ordered by value. The app runs as a single-player demo; these wire the real two-player paths + close product gaps. Several need prod creds (Yash) to fully verify live.)_
- [ ] **(Claude)** Wire the reveal loop to the server when signed in: `reveal.tsx` calls `fetchReveal(coupleDropId)`, `waiting.tsx` uses real `useDropState` (not the 2.6s demo timer), persist/pass `coupleDropId` play→waiting→reveal. (Demo path stays as-is. Needs two real accounts to verify end-to-end.)
- [x] **(Claude)** "From a drop" Love Map learnings: create a `source:'drop'` learning on reveal so the Love Map loop isn't fight-only. (`452e17b`)
- [ ] **(Claude)** Load real identity: a `useProfile` hook (display_name, partner name, together_since) → drive `profile`, `editProfile`, `manageSub`, `us` (today they show hardcoded Yash/Dani/23).
- [ ] **(Claude)** Edit Profile "Save changes" persists `display_name` (+ couples `together_since`) — currently a toast-only stub.
- [ ] **(Claude)** Spice level: persist `profiles.spice_level` on pick AND gate prompt/pack selection by spice (today it's cosmetic end-to-end; also normalize case to lowercase).
- [ ] **(Claude)** Real Unpair: a SECURITY DEFINER `unpair` RPC + wire it (today `handleUnpair` only toasts; no backend).
- [ ] **(Claude)** ManageSub: drive plan/renewal/shared-with rows from real RevenueCat `customerInfo` (currently hardcoded Annual/$39.99/Jun 15).
- [ ] **(Claude)** Onboarding loose ends: persist selected intents for brand-new users (stash → flush to `profiles` after signup); make the "Dani joined!" step wait for a real `status==='active'` before celebrating.
- [ ] **(Claude)** Push notifications (the habit trigger): add `expo-notifications`, request perms + schedule the daily local nudge at `notify_time` in onboarding finish; register `push_token`. Build-to-gate (needs a dev build to verify on device).
- [ ] **(Claude)** Polish: Play progress bar uses the `us` gradient (not flat p2); reveal verdict anaglyph; Wrapped story-fill animation; Us-tab live stats.

## In progress

_(nothing right now)_

## Done
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
