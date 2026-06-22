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

_(nothing queued — add a request and Claude will pick it up)_

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
