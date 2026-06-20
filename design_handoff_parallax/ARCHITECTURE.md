# Parallax — Production Architecture & Build Guide

This is the technical companion to `README.md`. It covers the recommended stack, data schema, build order, and the growth/retention model the product is designed around. Goal: ship fast with AI assistance while staying stable, secure, and scalable.

---

## 1. Recommended Stack

| Concern | Choice | Why |
|---|---|---|
| **App** | **React Native + Expo + TypeScript** | This prototype is already React — components translate almost directly. One codebase → iOS + Android. Expo handles push, builds, OTA updates. |
| **Backend / DB** | **Supabase** (Postgres + Auth + Realtime + Storage) | Relational model fits couples/drops/answers cleanly. **Realtime** powers the "Dani just played" pulse and the live reveal. **Row-Level Security** is the privacy backbone. |
| **Auth** | Supabase Auth (Apple + Google + email) | Apple sign-in is required for App Store given social login. |
| **Realtime** | Supabase Realtime channels | Partner activity, reveal unlock, nudges. |
| **Push** | Expo Notifications + a scheduler (Supabase cron / edge function) | The daily-trigger engine. Schedule per couple at their chosen time. |
| **Payments** | **RevenueCat** | Wraps StoreKit / Play Billing; entitlements + trials + receipt validation without hand-rolling. Maps to the `Plus` paywall. |
| **AI (Refocus)** | **Claude via a Supabase Edge Function** | Server-side only. Never ship API keys in the client. |
| **Analytics** | PostHog or Amplitude | Funnel + retention cohorts; you must measure D1/D7 and streak survival. |
| **Error monitoring** | Sentry | |

**Stay-stable rules:** TypeScript everywhere; RLS on every table from day one; all writes that affect both partners go through Postgres functions / edge functions (never trust the client); a couple of integration tests on the answer→reveal gate.

---

## 2. Data Schema (Postgres)

```sql
-- users: one row per person (extends auth.users)
profiles(
  id uuid pk references auth.users,
  display_name text, avatar_url text,
  intents text[],            -- onboarding intent capture
  spice_level text default 'flirty',
  notify_time time, notify_tz text, push_token text,
  created_at timestamptz )

-- couples: the pairing unit. Everything intimate hangs off couple_id.
couples(
  id uuid pk,
  member_a uuid references profiles, member_b uuid references profiles,
  invite_code text unique, status text,       -- 'pending' | 'active'
  together_since date, streak int default 0, longest_streak int default 0,
  freezes_remaining int default 2, last_played_on date,
  wavelength_avg numeric, plus boolean default false,
  created_at timestamptz )

-- drops: the daily content (global catalog + which couple got which when)
drops(id uuid pk, code text, title text, theme text, pack_id uuid null)
drop_prompts(id uuid pk, drop_id uuid, position int, emoji text, question text, options text[])
couple_drops(id uuid pk, couple_id uuid, drop_id uuid, date date, state text)  -- 'open'|'one_done'|'revealed'

-- answers: the heart. pick = own answer, hunch = guess about partner.
answers(
  id uuid pk, couple_drop_id uuid, prompt_id uuid, author uuid references profiles,
  pick int, hunch int, created_at timestamptz,
  unique(couple_drop_id, prompt_id, author) )
-- REVEAL GATE: a member may SELECT the *other* member's answers only when
-- couple_drops.state = 'revealed' (both submitted). Enforce in RLS, not the client.

-- love map: learnings from drops + refocus, with mastery
learnings(
  id uuid pk, couple_id uuid, about uuid references profiles,
  need text, detail text, source text,        -- 'drop' | 'refocus'
  origin text, mastery int default 0, became_prompt_id uuid null, created_at timestamptz )

-- refocus sessions
refocus_sessions(
  id uuid pk, couple_id uuid, topic text, state text,
  side_a text, side_b text, ai_result jsonb, created_at timestamptz )

-- activity feed (the two-player pulse / red dot)
activity(
  id uuid pk, couple_id uuid, kind text, actor uuid, payload jsonb,
  read_by uuid[], created_at timestamptz )

-- packs & entitlements
packs(id uuid pk, slug text, title text, emoji text, locked boolean)
-- subscription state mirrored from RevenueCat webhooks → couples.plus
```

**RLS principle:** every intimate table carries `couple_id`; policy = "current user is a member of this couple." Partner answers additionally gated on reveal state. This single rule makes the app private by construction — a core retention driver for couples apps.

---

## 3. Build Order (vertical slices, not screen-by-screen)

Build the **daily loop end-to-end first**, then layer the rest. Each slice is shippable.

1. **Auth + pairing.** Sign in → create couple → invite code / deep link → partner joins → `active`. (The viral loop + the thing everything depends on.)
2. **Daily loop.** Today screen → Play (pick + hunch) → submit → reveal gate → Reveal. Server-gated. This is the product; get it perfect.
3. **Notifications.** Time-anchoring in onboarding → scheduled daily push → deep link into Play. (The trigger; without it there's no habit.)
4. **Streak + activity.** Shared streak math (reset if either misses; freeze logic), activity feed + red dot, nudge.
5. **Us + Love Map.** History, wavelength chart, learnings (auto-created from drops).
6. **Refocus.** Two-sided private input → Claude edge function → resolution → write learnings (closes the loop).
7. **Monetization.** RevenueCat, paywall, packs, entitlement propagation.
8. **Growth surfaces.** Wrapped, share cards, home-screen widget, milestone celebration.

Ship 1–3 as a private beta with real couples before building 5–8.

---

## 4. The Growth & Retention Model (why the app is shaped this way)

Researched against Duolingo, Headspace, and the couples category (Paired, Between). The app is engineered around four proven mechanics — keep them intact when rebuilding.

**A. The trigger (Duolingo / Headspace).** A daily push, anchored to the couple's chosen routine moment, is the start of the habit loop. The onboarding time-anchoring step exists for this. Personalize send-time to when they actually engage.

**B. Intent + personalization (Headspace).** Onboarding asks "what do you two want" to set goals and build intrinsic motivation, then tunes content. Don't skip it.

**C. Shared streak with forgiveness (Duolingo).** The streak is *shared* — mutual accountability beats individual loss-aversion because neither wants to be the one who broke it. Milestones (7/30/100…) and a Streak **Freeze** relieve anxiety and cut churn. The 7-day streak is the leading indicator of long-term retention — optimize the first week hard.

**D. Share at peak delight (Spotify Wrapped / viral loops).** The reveal and Wrapped are the emotional peaks → that's where sharing and the soft upsell live. Share cards are identity artifacts (your Couple Type) that pull new couples in. Because the app is two-player, **every successful install already invited one other person** — virality is structural; protect the invite flow and don't prompt invites before the user understands the value.

**The compounding loop:** daily drops + refocused fights both write to the **Love Map** → the Love Map personalizes future drops → better drops deepen understanding → fewer/softer fights. Data accrual (the shared map, the history) is the moat and the switching cost.

**North-star + guardrails:** north star = *weekly paired active couples completing the daily loop together*. Watch D1/D7/D30 retention, 7-day-streak survival, reveal-completion rate (both answered), and invite→activation. Keep it "addictive in a good way": one calm daily nudge (not spam), forgiveness over guilt, and content that genuinely builds the relationship rather than dark-pattern dependency.

---

## 5. Things the prototype fakes (build for real)
- Partner answers are local — make them server rows behind the reveal gate.
- Waiting auto-advances — in production wait on the partner's real submission (realtime).
- The home-screen "widget" is an in-app mock — build a real WidgetKit (iOS) / Glance (Android) widget.
- Apple Pay / card fields are visual — use RevenueCat + native sheets.
- The phone status bar / home indicator are mock chrome — use real safe-area insets.
- AI Refocus output is scripted — wire the Claude edge function with the two sides as input.
