# Parallax — Product Strategy (synthesis)

Distilled from deep market/growth/UX research (June 2026). Full reports in `docs/research/`:
`01-competitive-landscape.md`, `02-growth-virality.md`, `03-ios-ux-excellence.md`.

This doc records decisions that **change or sharpen the roadmap**. The roadmap (`docs/superpowers/plans/2026-06-21-parallax-roadmap.md`) is still the build order; this is the "why" and the deltas.

---

## The wedge (what actually makes Parallax different)

"Answer privately → reveal side-by-side" is **table stakes** — Paired (8M downloads), Agapé, Flamme all do it. Parallax's genuine novelty is **the hunch** (you actively *predict* your partner) **+ the wavelength %** (a quantified, daily-moving relationship signal). This turns a journaling ritual into a **two-player game with a score**.

It's scientifically defensible: the hunch corrects projection bias and operationalizes Gottman "Love Maps" (couples with detailed Love Maps are far likelier to stay happily married). The tagline *is* the thesis.

**The moat is the data flywheel, not the mechanic** (the mechanic is copyable in a quarter): hunch history → personalized prompts → Refocus context. Build the flywheel fast.

---

## Decisions / roadmap deltas

### 1. Content depletion is existential — elevate AI prompt generation (NEW, high priority)
Every incumbent dies on "ran out / repetitive in 3 weeks." The roadmap's fixed `DROP` + packs are a launch seed, **not** the engine. We already have in-stack AI (Anthropic via Supabase Edge Function for Refocus) — reuse it to generate **personalized, never-repeating** prompts informed by the couple's hunch/Love-Map history.
**Action:** add a `prompt-generation` edge function and a `prompts` content pipeline as a first-class concern (slot it alongside Phase 2's daily loop; deepen in Phase 5 once Love Map data exists). Track "weeks of fresh content per couple" as a health metric.

### 2. The disengaged-partner death spiral — and our reveal gate makes it worse (CRITICAL)
A 2-person marketplace of size 1/side. If partner B doesn't submit, the reveal gate **blocks** partner A from their score → A churns too. This is the #1 category churn driver.
**Actions (build into Phase 2–4, not deferred):**
- Give A a **non-punishing solo path** when B lapses: A still sees their own answers, a "you'll see Dani's when they play" state, and **solo value** (reflection, streak-safe).
- Use the active partner to **re-activate the dormant one**: "Dani answered — see their guess" / one-tap nudge.
- **Never collapse A's streak because B lapsed.** Shared streak gets **two default freezes** (Finch-style forgiveness), not Duolingo anxiety.

### 3. Win Day 0 and the first 14 days (magic moment)
The magic moment is **two-sided D0**: both partners answer + hit their first wavelength reveal on day zero. Paired got +5% free→paid and +40% engagement just by perfecting the *first* core interaction.
**Actions:** deliver value before signup AND before the partner arrives (a <2-min solo "reflect" round); hard-gate only the partner-answer *reveal* (the blurred empty slot is the invite motivator). Benchmark against the dating floor: D1 ~26–30%, D30 ~5–6% (not a16z's social 50–70%).

### 4. The wavelength score can backfire — frame it as curiosity, never a verdict
A low number reads as "we're failing" and can start a fight. 
**Actions:** frame low scores as *curious* ("you surprised each other — worth a chat?"), route them into Refocus/threads, avoid scary absolute numbers early, make a miss feel like **discovery** ("you were 1 apart"), never failure. This is a copy + interaction-design rule for the Reveal screen (Phase 2).

### 5. Onboarding must not assume the couple is broken
Flamme alienates happy couples with "pick your problem." Keep onboarding **celebratory/curious**; gate Refocus as "for when you need it," not the hero. (Phase 1 onboarding copy.)

### 6. Pricing (Phase 7)
- **Per couple, never per person** (per-person is fatal — app is worthless if only one pays). Bill in **one place** (App Store via RevenueCat) — avoid Paired's hated double-charge.
- **Annual $39.99 is likely underpriced** (undercuts Paired $69.99 / Evergreen $49.99 / Flamme $44.99). Higher price → better conversion + LTV (RevenueCat data). **A/B test $39.99 vs ~$49.99.**
- **Raise monthly to ~$8.99** (current $4.99 makes annual only a 33% discount; category norm is ~50%) so the sticky annual plan (2.6× more retentive) dominates.

---

## Growth (Phase 8 priorities, ranked)

1. **Wrapped/ShareCard broadcast to *friends* (#1 viral lever).** Forced partner-pairing caps K below 1 (`K = i×c`, i≤1). The escape hatch is one-to-many sharing. Spotify-Wrapped-style 9:16 chaptered tap-to-advance cards, numbers reframed as narrative ("finished each other's sentences 82% of the time"), couple-archetype label, pre-rendered, screenshot-first, spoiler-safe. Identity-not-brand design = 5–10× organic sharing (Duolingo).
2. **The widget IS the product (#2).** Locket hit #1 in ~10 days / 80M downloads on a home-screen widget alone — ambient, screenshottable, demoable on TikTok. Live wavelength + tap-to-ping. Interactive widgets (iOS 17+).
3. **Distribution = organic founder TikTok + a "show your wavelength score" UGC challenge.** Every breakout (Locket, Gas, BeReal) grew on TikTok, not ads. Product Hunt warm-up (Sat/Sun for #1), ASO on couple/widget keywords.
4. Forced pairing is still the cleanest **activation** loop (romantic-partner invite conversion 30–55% vs 3–5% generic) — gate the reveal on both answering. It just isn't a *growth* engine by itself.

Under-evidenced (test, don't bet): couple-archetype virality, gifting CAC, couple leaderboards.

---

## iOS UX excellence (apply across all phases)

- **Glass only in the nav/control layer** (frosted tab bar, floating CTAs), never nested; the wavelength ring is **content**, not chrome. Provide a `systemThinMaterial` / Reduce-Transparency fallback.
- **Haptics as a sparse vocabulary, always paired with a visual:** `selectionAsync` on pick, `impactAsync(Light/Medium)` on lock-in, `notificationAsync(Success)` on a matched reveal. Never on cold-start, never as the only feedback.
- **Premium speed bar:** 100ms input response, <400ms total. **Optimistic UI** on hunch submit so latency never shows.
- **The dopamine is in anticipation:** 600–900ms wavelength-ring build-up before the Reveal, then fire confetti + Success haptic + sound **once** on match.
- **Prime the push prompt** (it fires once, denial is permanent): Parallax-styled soft-ask after the first Reveal, never iOS's dialog cold.
- **Refocus is a separate, calmer mode:** self-soothe → independent NVC-framed write → AI bridge naming shared emotional themes (gently, never blaming) → resolution to the Love Map. **No confetti, no playful Peek, no celebratory haptics**, always-on crisis tripwire.
- **Anti-slop:** our dawn gradient is literally the recommended "sunrise" alternative to slop purple-blue; Instrument Serif + Peek (a coherent modular rig, not a static sticker) + the wavelength ring are the typography/color/motion/mascot levers that escape the templated look. Avoid red/pink heart clichés, untouched system sheets, glass beyond the nav layer.
