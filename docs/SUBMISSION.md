# App Store Submission Playbook — pass review the first time

The code side is built (see GO_LIVE). This is the checklist + the App-Store-Connect-side work that gets Parallax through review on the **first** try. Reviewers reject for predictable reasons — each is pre-addressed below.

## A. Hard requirements that must exist before you submit
| Item | Status | Owner |
|---|---|---|
| **App icon** (1024×1024 PNG, no alpha, no rounded corners) | ✅ DONE 2026-07-03 — `assets/icon.png` (para//ax slashes on dawn), wired in app.json + Android adaptive + splash. Dani may restyle anytime. | Done (Claude) |
| **Screenshots** (6.7" + 6.5" iPhone, a few per size) | ❌ blocked on this Mac (no Xcode/simulator — CLT only). Capture on the MacBook sim or from the TestFlight build. Same blocker for the 3 IAP review screenshots (IAPs sit at MISSING_METADATA until uploaded). | Yash/Dani |
| **Privacy Policy URL** (publicly reachable) | ✅ LIVE: https://yash-gadodia.github.io/parallax/legal/privacy.html (contact pirsquare.yash+parallax@gmail.com; lawyer review still recommended) | Done (Claude) |
| **Terms of Service URL** | ✅ LIVE: https://yash-gadodia.github.io/parallax/legal/terms.html | Done (Claude) |
| **Account deletion in-app** | ✅ built + deployed (`delete-account` edge fn) — reviewers test this | Done |
| **Demo/review account** | ✅ pre-paired on prod (Alex & Sam, 3 revealed drops @83%, streak 3) — creds in .secrets/KEYS.md | Done (Claude) |
| **Apple Developer account active** + **App Store Connect app record** | ⏳ enrollment activating; create the record under your **personal** team | You |
| **Working sign-up email** | ⛔ Supabase default email is rate-limited; set up **Resend** SMTP or reviewers can't register | You (GO_LIVE §3) |

## B. App Privacy "nutrition labels" (App Store Connect → App Privacy)
Fill these accurately — mismatches are a top rejection cause. Parallax collects:
- **Contact Info:** email address — *App Functionality, Linked to identity.*
- **User Content:** the daily answers/hunches, Love Map entries, Refocus messages — *App Functionality, Linked to identity.* (Sensitive — relationship data.)
- **Identifiers:** user ID — *App Functionality.*
- **Usage Data / Diagnostics:** analytics + crash (only if you enable PostHog) — *Analytics.*
- **Purchases:** subscription status (via RevenueCat) — *App Functionality.*
- **Not collected:** precise location, contacts, health, financial, browsing history.
- **Tracking:** Parallax does **not** track across other companies' apps → answer "No" to tracking (no ATT prompt needed) unless you add an ad/attribution SDK.

## C. Reviewer demo account (couples apps get rejected without one)
The reviewer must be able to see the *paired* experience, not just the "invite your partner" wall. In **App Review Information → Sign-In Required → Demo Account**, give a **pre-paired** account's email/password. Claude can seed a confirmed, already-paired couple (with some answered drops so the reveal is visible) directly in prod — ask when you're ready to submit, and add a note: *"This is a couples app; the demo account is pre-paired so you can see the full reveal/Refocus loop. Answer-ahead lets a solo user in too."*

## D. Common rejections — and how Parallax already answers them
- **5.1.1(v) Account deletion** → built (`delete-account` fully erases data + the Auth record).
- **Guideline 1.5 / 5.1 Privacy** → privacy policy required (host it) + accurate labels (§B).
- **4.0 / 2.1 "couldn't review / login"** → demo account (§C) + working email (Resend).
- **3.1.1 IAP** → Parallax Plus must use Apple IAP (RevenueCat handles this) — don't link to external payment.
- **AI content (Refocus)** → ToS disclaims it's not therapy/crisis support (`docs/TERMS.md` §3). Keep that.
- **Sign in with Apple parity (4.8)** → if you offer Google sign-in, you MUST also offer Sign in with Apple. `expo-apple-authentication` is already a plugin — wire both, or ship email-only first.
- **Crashes / broken links** → app passes `tsc`/`jest`/`expo export`; verify the build runs before submitting.

## E. The submission sequence (once Apple is active)
1. App Store Connect → switch to your **personal team** → **+ New App** (bundle `com.yashgadodia.parallax`, your chosen unique **name** — check availability!).
2. Create an **App Store Connect API key** (Admin) → send to Claude → `eas build -p ios --profile production` then `eas submit -p ios`.
3. Fill: privacy URL, support URL, description, keywords, screenshots, **App Privacy** labels (§B), **demo account** (§C), age rating (17+ likely, mature/suggestive themes for a couples app).
4. Submit → TestFlight first (beta), then App Store review.

> Keep this in sync with `docs/GO_LIVE.md`. The two un-fakeable blockers for a first-pass approval are the **app icon** and a **hosted privacy policy** — line those up early.

## F. Review rejection 2026-07-08 (v1.0 build 11) — resolution log
Submission `cf39f2d8-64e4-44d3-9515-799a9b58a29f`. Two guidelines:

- **2.1(b) — IAP products not submitted for review.** The 3 IAP products (annual/monthly/lifetime) sit at MISSING_METADATA and were never attached to the version. **Dashboard-only, Yash:** in App Store Connect → the app version → **In-App Purchases**, add all three products, upload the required **App Review screenshot** per product (needs a Mac sim / TestFlight build — the §A blocker), then submit them *with* the next binary. IAPs must be in the same submission as the build.
- **3.1.2(c) — subscription info.** Two halves:
  - **In-app (DONE in code, this commit):** the purchase-flow screens (`app/checkout.tsx`, `app/(sheets)/plus.tsx`) already showed title/length/price; they were missing **functional Terms of Use (EULA) + Privacy Policy links**. Added `src/components/LegalLinks.tsx` (URLs in `src/lib/links.ts`) to both. Links point to the live GitHub Pages docs (verified 200). **Rebuild + resubmit binary** for this to count.
  - **Metadata (DONE via ASC API):** privacy-policy URL was already set in its dedicated field; the **Terms of Use (EULA)** link is now appended to the **App Description** (`appStoreVersionLocalizations` PATCH, en-GB). Both halves satisfied.
  - Reply to Apple with a **screen recording** showing the two links working in the paywall, and note it in App Review Information → Notes.

### Still blocking the resubmit (as of 2026-07-09)
1. **New binary (build 13)** — the LegalLinks code ships only in a fresh build; builds 11 & 12 predate it. Needs `eas build -p ios --profile production` → **requires EAS login** (interactive; `eas whoami` = not logged in). Only the account owner can start it.
2. **Subscriptions `parallax_plus_annual` + `parallax_plus_monthly` = MISSING_METADATA.** Confirmed present via API: name, `ONE_YEAR`/`ONE_MONTH` duration, USD base price, en-US localization, 175-territory availability, review screenshot. The public API doesn't expose the offending field — open each in ASC → the inline "Missing Metadata" badge names it (likely the localized display-name/description or a price-schedule gap). Lifetime IAP is already WAITING_FOR_REVIEW.
3. Then: attach build 13 + all 3 IAPs to the version → **submit for review** → reply to Apple with the screen recording.
