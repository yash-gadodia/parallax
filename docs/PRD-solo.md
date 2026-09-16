# Parallax — PRD, solo rebuild

Status: DRAFT for Yash
Date: 2026-09-16
Supersedes: the v2 two-sided mediator as the product's centre of gravity

---

## 1. The decision that starts this

Parallax stops being a two-person app. No invite, no pairing, no partner account,
no shared view. One person, their own phone, their own record.

This is not a retreat. Across five clusters of competitor research, **partner
dependency was the most consistent failure in the category** — and it fails
hardest at the exact moment the product is needed. Two representative findings:

- Paired (207K ratings) has **no flow at all** for during or after a specific
  fight. Conflict is a magazine topic.
- A Lasting reviewer, on that app's own Conflict and Repair curriculum: *"we felt
  that we were left on our own for those questions where we did not agree. You
  are just left hanging."*
- And the recurring churn reason, in users' words: *"it requires both partners to
  actually use the app, and that did not happen for any of them."*

Removing the second person removes the category's main way of dying.

## 2. Who it is for, in order

The audience is a ladder, and each rung is a gate on the next:

1. **Yash, using it himself** — repeatedly, unprompted, over weeks
2. **Dani**
3. **A few friends**
4. **Real users / growth** — only once 1–3 hold

Nothing in this document optimises for rung 4. No funnel, no virality, no
retention mechanics. The goal at rungs 1–3 is that the thing is *good*; if it is
good, rung 4 becomes a question worth asking later.

## 3. The tension this PRD has to resolve

**Stated goal: "myself, using it daily." Reality: nobody fights daily.**

An app whose trigger is conflict is episodic — perhaps two to six times a month,
often less. There are only three honest responses:

**(a) Accept that it is episodic, and change the success measure.**
The bar becomes *"used every time it was relevant"*, not *"opened every day"*.
A tool used 100% of the times it mattered is working perfectly at 3 sessions a
month. Measuring it by DAU would call that failure.

**(b) Add a daily surface so the app has a reason to exist between fights.**
This is what v1 did with the daily drop and pulse. It was cut in v2 for being
homework, and the competitor research is unambiguous about where that leads —
the single loudest complaint about Paired is that it *"feels like homework"* and
partners stop opening it.

**(c) Widen the trigger from "fights" to "friction".**
Not only the shouting matches — the flat tone, the thing you let go, the second
time this week you felt like the flexible one. That is genuinely more frequent
without being a manufactured habit, and it feeds the pattern engine with real
material.

**Recommendation: (a) plus (c). Explicitly not (b).**
Widen the trigger to friction, and measure relevance-coverage rather than daily
opens. Do not build a streak, a daily prompt, a reminder habit, or any mechanic
whose purpose is to make the app open on a day when nothing happened. If Yash
finds himself opening it most days, that is because friction is more frequent
than fights — not because the app nagged.

## 4. What the app gives back — the core decision

Three candidates, with a recommendation.

### Option A — Understanding now, plus patterns over time
Each entry returns what was underneath it for you. Across entries, the app names
what keeps recurring. No advice, no words to use.

- ✅ Squarely matches "get to know yourself and your partner better"
- ❌ This is the **most crowded space in the research**. Rosebud, Stoic, Finch,
  How We Feel, Day One all do reflective self-knowledge, several of them free.
  Nothing here is something a person cannot get more easily elsewhere.

### Option B — Keep the bridge, add the patterns ← RECOMMENDED
Each entry returns three things, inseparable: what is underneath it for you, the
specific thing your partner is probably not wrong about, and **one sentence you
could actually send**. Over time, the recurring shape is named.

- ✅ Preserves the **only defensible gap the research found**: every substitute a
  person can reach at 11pm — a friend, a subreddit, ChatGPT, Notes — is selected
  for agreement. Nothing defaults to naming the part your partner is not wrong
  about, and nothing ends in a sendable sentence that concedes it.
- ✅ Consistent with the answer to "does the partner disappear": they are gone
  from the app, but **you still send things**. The bridge is the artefact that
  leaves.
- ✅ The concession is what makes the self-knowledge land. "You were the flexible
  one again" is a horoscope. "You brought his mother into it, and that is what
  moved the fight off the booking" is not.
- ❌ Highest quality bar. A tone-deaf sentence an hour after a fight is worse
  than nothing.

### Option C — Patterns only, no advice, no words
It reflects and notices; it never suggests what to say.

- ✅ Lowest risk
- ❌ Least actionable, and lands in the same crowded space as A

**Recommendation: B.** The bridge is the reason this is not a journal. Dropping
it makes Parallax a worse Rosebud. Keeping it is the whole claim.

## 5. The archive problem, answered deliberately

"Log fights" walks straight into the finding that a **browsable archive of your
arguments is a liability object inside a relationship** — it converts *"I
apologised for that"* into *"you did this in March"*, and it is the first thing
someone reaches for when angry.

The product needs self-knowledge over time without becoming evidence. The
resolution:

- **Raw writing is deleted after 30 days.** Automatic, stated plainly at the
  point of writing, not buried in settings.
- **What persists is shape, never transcript**: topic, what it touched, how it
  ended. Enough to notice "this is the third version of the same fight",
  not enough to re-litigate one.
- **No browsable list of named fights.** No titles like "Dinner at your mum's,
  again" in a scrollable feed.
- **Patterns decay.** A recurring theme that stops recurring fades out rather
  than standing as a permanent charge.
- **One-tap delete everything**, and it really deletes.

This is a real constraint, not a privacy footnote: it is what separates
self-knowledge from score-keeping.

## 6. Scope

### In
- One-person capture of a friction moment: a scaffold of tappable slots above a
  free-text box, submittable from a single chip
- The three-part return: underneath / what they are not wrong about / the bridge
- The bridge is editable and must be touched before it can be copied. Copy only,
  never a Send button
- Decaying pattern line across entries
- 30-day raw deletion, shape retention, one-tap delete-all
- Two-tier safety: a hard stop for violence, coercion, self-harm and child
  safety; and a silent downgrade that suppresses the accountability paragraph
  and the partner-side read when the account is ambiguous
- Account, notifications, subscription management, delete

### Out
- Any partner account, invite, link, pairing or shared view
- Streaks, scores, ratings, percentages, prognoses
- A daily prompt, pulse, reminder habit or content library
- A widget or Live Activity (a partner can see a lock screen)
- A browsable archive of past fights
- A chat interface
- Credibility theatre: cited studies, clinician logos, "clinically backed"

## 7. Quality bar for the output

These are product requirements, not copy suggestions. Grounded in the conflict
research.

**Construction:** name the act, refuse the trait, attribute the distortion to a
mechanism every human has, and apply the identical operation to both people.
"He is selfish" becomes "he made the plan without checking, on a night you had
been counting on" — and the same move run on the user is honest rather than cruel.

**The bridge:**
- 40 words maximum, one paragraph, no greeting or sign-off
- The payload is a concession, an act of investment, or standing down — not an
  apology. An apology may ride along in one clause; it is never the whole message
- Order: acknowledge their side, then yours in I-language, then the specific
  thing you own, then one concrete offer
- Never ends on a request for forgiveness or a status check. No "are we ok?"
- Bans every conditional apology: "I'm sorry you felt", "I'm sorry but",
  "I'm sorry if", "I apologise for my part"

**Never:** a prognosis, a score, a ratio, a percentage, or a clinical label on
either person.

**Singapore specifics** (the app's first and only market for now): money sent to
parents is a legal duty under the Maintenance of Parents Act, not a boundary
failure; a BTO flat is a dated deadline, not a metaphor; National Service is a
compulsory separation neither person chose; and "counselling" points at
pre-divorce-filing programmes, so it must never be offered as a suggestion.

## 8. Safety — the constraint that shapes everything

From one written account, **this app cannot reliably distinguish coercive control
from ordinary conflict.** DARVO is optimised against exactly this reader: an
offender's account reads as reasonable and self-contained, a victim's reads as
disproportionate and history-laden. So the feature that names your contribution
would, pointed at someone being controlled, tell them they were wrong.

Two tiers, and the second is the non-obvious one:

- **Tier 1, hard stop.** Physical acts, threats, strangulation, weapons, coerced
  sex, stalking, financial control, being prevented from leaving, fear of the
  partner, self-harm, child safety, a minor with an adult. No analysis, no
  bridge, no accountability. A plain sentence, verified local routes, a device-
  safety line.
- **Tier 2, silent downgrade.** A deliberately over-inclusive screen that never
  announces itself and never shows a score. It suppresses the accountability
  paragraph, the partner-side read, and any demand-style bridge. Uncertainty
  resolves toward downgrade.

**The governing rule: if it is not safe to tell someone to reach out, it is not
safe to tell them what they did wrong.**

The single highest-harm sentence to suppress: *"your reaction probably looked
disproportionate to him."*

## 9. Success criteria, by rung

**Rung 1 — Yash.** Used every time a friction moment was worth logging, over at
least four weeks, unprompted. At least one bridge sent to Dani that changed how
a conversation went. Not measured: daily opens.

**Rung 2 — Dani.** Uses it on her own, for her own moments, without being asked
twice. Says something the app gave her that she would not have got from talking
to a friend.

**Rung 3 — a few friends.** Three to five people, screened for having had a fight
in the last month. Each used it through a real one. At least one can quote a line
it gave them.

**Rung 4 — only then.** Growth is a question for after rungs 1–3 hold, and the
answer might still be "no".

## 10. Open questions

- Pricing. A subscription exists and Yash wants to keep it. The ladder is
  currently broken: S$59.98/yr against S$6.98/mo is an 8.6-month break-even when
  comparables run 2–5, which makes the annual irrational to buy. The core loop
  stays free either way.
- What exactly the pattern line can claim on 10–20 noisy self-reported events a
  year without overstating.
- Whether "friction" as the trigger holds up in practice or quietly becomes a
  daily journal.
- The IMH helpline number (6389 2222) in the shipped edge function has never been
  verified against an official source.

## 11. Next

1. Approve or amend this PRD, especially §3 (daily vs episodic) and §4 (the output)
2. Targeted research on the gaps in §10
3. UI/UX in Claude Design against this document
4. Build as 2.1
