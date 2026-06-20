# Handoff: Parallax — a Gen Z couples app

## Overview
**Parallax** is a native mobile app for two people (couples). Its core mechanic: each day, both partners get the same short "drop" of questions. You answer for **yourself** and place a **hunch** on what your partner will say. When you've both played, the **reveal** shows how in-sync you are (a "wavelength" %), where your hunches landed, and where the cute little gaps are. Over time the app builds a shared **Love Map** of what you're learning about each other — fed both by the playful daily drops *and* by **Refocus**, a calm conflict-mediation flow for the rough moments.

The product thesis: *two people never see things exactly the same, and that offset (the "parallax") is what gives a relationship depth.* The daily ritual builds understanding when things are good; Refocus repairs it when they're not. Both feed one shared map.

**Tagline:** "mind the parallax error"
**Wordmark:** `para//ax` — the "ll" is rendered as two parallel slashes (one coral, one periwinkle = the two partners).

---

## About the Design Files
The files in this bundle are **design references created in HTML/React (via in-browser Babel)** — interactive prototypes showing the intended look, copy, and behavior. **They are NOT production code to ship directly.** The in-browser Babel setup, the `window.PXC/PXS/PXF/...` globals, and the single-file phone mock are prototype scaffolding only.

Your task is to **recreate these designs in a real mobile codebase** using its established patterns. If no codebase exists yet, the recommended stack is in `ARCHITECTURE.md` (React Native + Expo + Supabase). Lift the exact visual values (colors, type, spacing, copy) from the prototype; rebuild the structure idiomatically.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, copy, and interactions are all intended as shown. Recreate the UI pixel-accurately using the target codebase's component library. Two caveats:
- The prototype renders inside a fixed 390×820 "phone" frame. In production these are full device screens — use safe-area insets, not the mock's hardcoded status bar / home indicator.
- Entrance animations were deliberately kept minimal so print/screenshot states never show pre-animation blank frames. Add tasteful motion in production (see Interactions).

---

## Information Architecture

**Bottom nav (3 tabs):** `Today` · `Refocus` · `Us`
- **Today** is the daily ritual (the habit driver). Packs are folded in as a "Send a pack" action, not a tab.
- **Refocus** is a permanent, calm tab (warm coral heart icon) — always one tap away, but never shouting. Conflict is the *soul* of the app, not the daily headline.
- **Us** is the shared space: wavelength history, Love Map, Wrapped, stats, drop archive.

**Why this structure (research-backed):** conflict is infrequent, so leading the home with "had a rough moment?" would make the app feel empty most days and frame the relationship around fighting. The daily drop earns the everyday habit; Refocus sits permanently available for when it's needed.

---

## Screens / Views

> Component file references point to the prototype source in this bundle. All screens share the phone shell, frosted bottom nav, and bottom-sheet system defined in `couples-core.jsx`.

### Onboarding (`couples-flows.jsx` → `Onboarding`)
A 6-step first-run flow. Progress dots on the 4 "stepped" screens (welcome and "joined" are moments, no dots).
1. **Welcome** — Peek mascot (animated), `para//ax` wordmark, tagline, one-line value prop, "Get started" + "I already have an account".
2. **How it works** — 3 vertically-centered steps (Answer honestly / Call their answer / Come into focus), each an avatar + title + sub.
3. **Intent capture** — "What do you two want?" multi-select chips (Know each other / Spark conversations / Navigate hard moments / Long-distance / Have fun). *Captures intent → personalizes content & builds intrinsic motivation (Headspace pattern).*
4. **Pair up** — invite code `YASH-4827`, "Send Dani the link" (the two-player viral loop; the app is useless until the partner joins, so k-factor is structural).
5. **Joined** — celebratory "Dani joined!" moment with both avatars.
6. **Notification time-anchoring** — "When's your moment?" time chips (Morning coffee 8:00 / Lunch 12:30 / Evening 8:00 / Before bed 10:30) + "Turn on daily nudge". *This is the habit-loop TRIGGER — anchoring the daily push to an existing routine (Headspace/Duolingo pattern).*

### Today / Home (`couples-screens.jsx` → `Home`)
- **Header:** `para//ax` wordmark (left); streak flame pill, activity bell (with red dot when unread), and user avatar (right).
- **Partner ping banner** (when you haven't played): "Dani already played today · your turn, no peeking".
- **Daily drop hero card:** gradient header with `DROP 27 · SUNDAY`, floating 💌, big serif title "soft launch", 3 prompt-emoji tiles, "Play today's three" CTA. When complete, the card flips to show the wavelength % and "See the reveal →".
- **Send a pack** row (folded-in Packs entry).

### Play (`couples-screens.jsx` → `Play`)
The core loop. Per prompt, two phases:
1. **Pick** (coral) — your honest answer.
2. **Hunch** (periwinkle) — what you bet Dani will say.
Progress bar across all (prompts × 2) steps; back nav; selectable option rows with radio + fill state. 3 prompts → 6 steps → `Waiting`.

### Waiting (`couples-screens.jsx` → `Waiting`)
"Tallying your hunches…" with overlapping avatars, then auto-advances to Reveal (in production, gate on partner actually having answered).

### Reveal (`couples-screens.jsx` → `Reveal`)
The payoff (peak-delight moment → prime spot for share + soft upsell).
- Peek mascot reacts to score; `para//ax` wordmark animates from **offset → aligned** as the score rings up ("parallax → in focus").
- Animated **wavelength ring** with the %; verdict line ("Basically telepathic." etc.); stats (hunches landed, twin moments).
- **Per-prompt compare cards:** your pick vs Dani's pick (equal-height chips), a hunch ✓/✗ row with a witty note, and a 💬 thread entry point.
- "Share your wavelength" + "Done for today" + circular close.

### Thread (`couples-flows.jsx` → `Thread`)
Lightweight chat to talk about one answer. Pinned prompt context, message bubbles (you = coral, Dani = periwinkle), emoji quick-reactions, text input.

### Packs + Pack detail (`couples-screens.jsx` → `Packs`, `couples-flows.jsx` → `PackDetail`)
Browse themed packs (Deep end = free, After dark/Chaos hour/Someday = Plus). Detail shows sample questions (blurred if locked) and either "Send drop to Dani" or "Unlock with Plus".

### Us (`couples-screens.jsx` → `Us`)
Shared space: paired avatars + "together since" + streak; **Wrapped** hero card; **Love Map** preview (2 learnings); wavelength bar chart (last 7 drops); stat trio; tappable drop history archive.

### Love Map (`couples-lovemap.jsx` → `LoveMap`)
The loop made visible. Hero + the "parallax loop" explainer (fought → refocused → became a question). List of **learnings**, each tagged `FROM A FIGHT` or `FROM A DROP`, with a 4-step **mastery meter** (just learned → second nature) and, where relevant, the daily question it became. "Refocus something" CTA.

### Refocus (`couples-refocus.jsx` → `Refocus` / `Resolution`)
AI conflict mediation. Each partner privately shares their side; the app finds where you agree, names the two angles, surfaces what's underneath each person's need, and offers a way back. Resolution **captures each person's need into the Love Map** (closing the loop) — this is the differentiator: the same fight feeds future daily questions so it's less likely to repeat.

### Wrapped (`couples-viral.jsx` → `Wrapped`)
Spotify-Wrapped-style tap-through story (progress bars, tap zones): cover → stats (drops, twin moments, most-missed question) → **Couple Type** archetype ("The Slow Burn") → share card. The shareable identity artifact that drives downloads.

### Streak (`couples-viral.jsx` → `Streak`) + Milestone (`couples-activity.jsx` → `Milestone`)
- **Streak:** big shared flame, "this one's *shared* — if either of you skips, it resets" (mutual accountability beats solo loss-aversion), this-week dots, milestone track (7/30/50/100/365), and a **Streak Freeze** (forgiveness — reduces anxiety/churn).
- **Milestone:** full-screen celebration when a shared streak crosses a milestone; shareable.

### Activity (`couples-activity.jsx` → `Activity`)
The two-player pulse + the red-dot trigger. Feed of: Dani played, Dani nudged you, milestone reached, Dani sent a pack, you refocused, twin moments. Unread items highlighted; opening clears the dot.

### Widget setup + Home-screen mock (`couples-viral.jsx` → `WidgetSetup`, `HomeScreen`)
Locket-style growth surface: a live wavelength widget + a tap-to-ping widget on a mock iOS home screen (tapping ping rains hearts: "Dani felt that 💞"). The screen-recordable viral asset. *In production this is a real WidgetKit / App Widget, not an in-app mock.*

### Profile / Settings (`couples-flows.jsx` → `Profile`, `couples-pay.jsx` → `EditProfile`)
Identity (tap → Edit Profile), nudge-partner card, Plus status, **Spice level** picker (Sweet/Flirty/Spicy — controls prompt suggestiveness), notifications, home-screen widget, replay intro, manage pairing, unpair.

### Plus / Payments (`couples-pay.jsx` → `Checkout`, `PlusSuccess`, `ManageSub`; `couples-flows.jsx` → `PlusSheet`)
- **PlusSheet** (bottom sheet) — perks + "Start 7 days free" → Checkout.
- **Checkout** — perks list, Annual ($39.99, "BEST VALUE") / Monthly ($4.99) plan picker, Apple Pay / Card methods (card fields), sticky CTA, "Confirming…" spinner.
- **PlusSuccess** — confetti "You're both in 💞", routes to unlocked packs.
- **ManageSub** — plan, trial-ends, renewal, shared-with, switch/cancel (cancel actually reverts to free).
- Premium state (`plus`) propagates everywhere: packs unlock, Plus banners appear, locked detail becomes sendable.

---

## Interactions & Behavior
- **Navigation:** tab bar on Today/Refocus/Us; sub-screens use a back-arrow TopBar; modals use bottom sheets (slide up, dim backdrop, drag handle).
- **Play → Reveal:** selecting a pick auto-advances after ~360ms; last hunch → Waiting → Reveal.
- **Reveal animations:** wavelength ring strokes from 0→score (1.1s cubic-bezier); wordmark slashes translate offset→aligned (~0.55s) ~780ms in.
- **Pressables:** scale to 0.975 on press (0.14s).
- **Toasts:** pill, slide-up, auto-dismiss ~1.9s.
- **Tap-to-ping (widget/home mock):** spawns 6 floating heart emojis (1.6s rise + fade) + toast.
- **Activity:** unread dot clears ~0.9s after opening.
- **Empty/edge states to build in production:** partner hasn't joined yet, partner hasn't played, streak = 0/1, no learnings yet, no activity, offline, payment failure.

## State Management
Prototype keeps everything in one `App` state object (`couples-app.jsx`). Key fields: `screen`, `streak`, `done`, `wave`, `plus`, `name`, `spice`, `myPicks[]`, `myHunches[]`, `play{idx,phase}`, `pack`, `drop`, plus `sheet` and `toast`. In production, split into: auth/user, couple/pairing, today's drop + answers (server-synced, realtime), subscription (RevenueCat), and local UI state. The reveal must be **server-gated** — a client must not see the partner's answers until both have submitted.

---

## Design Tokens
**Colors**
```
--bg-0:      #FBF1F2   (blush canvas)
--bg-1:      #F1ECFB   (lavender canvas)
--surface:   #FFFDFD   --surface-soft: rgba(255,255,255,0.62)   --sunken: #F4ECF4
--line:      rgba(58,51,64,0.09)
--ink:       #3A3340   --ink-soft: #8B8398   --ink-mute: #B7B0C2
--p1 (you):  #FF8E7A   --p1-deep: #EF6A53     (pastel coral)
--p2 (them): #9D95F5   --p2-deep: #7064E6     (pastel periwinkle)
--match:     #54C2A0   --match-deep: #2E9C7C  (mint = a hunch landed)
--us gradient:      linear-gradient(118deg,#FF8E7A 0%,#C387C9 48%,#9D95F5 100%)
--us-soft:          linear-gradient(118deg,rgba(255,142,122,0.16),rgba(157,149,245,0.16))
--dawn (app bg):    radial-gradient(120% 80% at 18% 0%,#FCEFF0 0%,#F6EDF6 42%,#EEEDFB 100%)
```
**Typography**
- Display / romantic: **Instrument Serif** (regular + italic). Big titles, the wordmark, score numbers.
- UI / body: **Hanken Grotesk** (400–800).
- Mono / labels & numerals: **Space Mono** (400/700). Used for ALL-CAPS kickers (10px, letter-spacing 0.18em) and diagnostic numbers.
- Min sizes: body 13–15px, kickers 9–11px, hero serif 34–64px.

**Radius:** chips/buttons 999 (pill); cards 20–30; tiles 11–16.
**Shadows:**
```
--shadow:      0 16px 44px rgba(112,100,230,0.13), 0 4px 14px rgba(239,106,83,0.07)
--shadow-soft: 0 10px 30px rgba(112,100,230,0.10)
--shadow-pop:  0 -10px 44px rgba(58,40,70,0.18)   (bottom sheets)
```
**Spacing:** screen gutters 20px; card padding 14–22px; element gaps 8–16px.

## Assets
All visuals are code-drawn — **no raster assets**:
- **`para//ax` wordmark** — text + two CSS bars (`Slashes`/`Wordmark` in `couples-core.jsx`). Bars: width 0.1em, height 0.7em, `skewX(-11deg)`, inline-block on the baseline. `offset` prop nudges the 2nd bar up 0.13em (the parallax shift, used in the Reveal animation). `light` prop for dark/gradient backgrounds.
- **Peek mascot** — inline SVG, two overlapping "3D-glasses" lens-eyes (coral + periwinkle) that blink / search / focus / love (`Peek` in `couples-core.jsx`). Moods: `happy|focus|search|love`.
- **Mark** — simple two-overlapping-circles glyph.
- **Icons** — single-path SVGs in the `I` map (`couples-core.jsx`); render via `G`.
- **Fonts** — Google Fonts (Instrument Serif, Hanken Grotesk, Space Mono).
- Emoji are used as expressive accents throughout (tasteful, sparing).

## Files (in this bundle, under `design_files/`)
- `Parallax-final.html` — entry point; design tokens, fonts, keyframes, script load order.
- `couples-core.jsx` — tokens, data models, icons, mascot/wordmark, shared atoms, phone shell, nav, sheets.
- `couples-screens.jsx` — Home, Play, Waiting, Reveal, Packs, Us.
- `couples-flows.jsx` — Onboarding, Profile, PackDetail, DropDetail, Thread, ShareCard, PlusSheet, SpiceSheet.
- `couples-viral.jsx` — WidgetSetup, HomeScreen mock, Wrapped + Couple Type, Streak.
- `couples-activity.jsx` — Activity inbox, Milestone celebration.
- `couples-lovemap.jsx` — Love Map.
- `couples-refocus.jsx` — Refocus conflict mediation + Resolution.
- `couples-pay.jsx` — Checkout, PlusSuccess, ManageSub, EditProfile.
- `couples-app.jsx` — the router wiring all screens.
- `ARCHITECTURE.md` — recommended production stack, data schema, build order, the growth/retention model.
```
```
