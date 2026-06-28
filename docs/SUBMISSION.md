# App Store Submission Playbook — pass review the first time

The code side is built (see GO_LIVE). This is the checklist + the App-Store-Connect-side work that gets Parallax through review on the **first** try. Reviewers reject for predictable reasons — each is pre-addressed below.

## A. Hard requirements that must exist before you submit
| Item | Status | Owner |
|---|---|---|
| **App icon** (1024×1024 PNG, no alpha, no rounded corners) | ❌ **MISSING** — `app.json` has no `icon`. Needs a real designed icon. | Design (Dani) |
| **Screenshots** (6.7" + 6.5" iPhone, a few per size) | ❌ missing — needs real screens of the app | Design / capture from a build |
| **Privacy Policy URL** (publicly reachable) | Drafts in `docs/PRIVACY.md` — need **hosting** + a real **contact email** | You |
| **Terms of Service URL** | Draft in `docs/TERMS.md` — host alongside privacy | You |
| **Account deletion in-app** | ✅ built + deployed (`delete-account` edge fn) — reviewers test this | Done |
| **Demo/review account** | ⛔ create a pre-paired couple so the reviewer can experience the 2-player loop (see §C) | You + Claude |
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
