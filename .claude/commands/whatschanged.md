---
description: Plain-English summary of recent changes for a non-technical reader
---

Summarize what has changed in the repo recently, written for a non-technical reader (Dani).

1. Look at recent history: `git log --oneline -15` (go further back if the user asks about a longer period), plus `git status` and `git diff --stat` for any uncommitted work in progress.
2. Translate into **what a user of the app would notice** — screens, copy, content, behavior. Never list file names, commit hashes, or technical jargon in the summary itself.
   - Good: "The reveal screen now celebrates when you both pick the same answer, and the streak flame pulses on day 2-6."
   - Bad: "Refactored useTodayState.ts and updated 0022_streak_grace.sql."
3. Group by theme (looks, content, fixes, behind-the-scenes). Behind-the-scenes work (tests, plumbing) gets at most one line: "plus some invisible reliability work."
4. Flag anything **not yet saved/committed** in one friendly line ("there's also work-in-progress on X that hasn't been checkpointed yet — say 'save this' when you're happy").
5. Keep it short: a handful of bullets, no walls of text.
