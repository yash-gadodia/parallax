# Build Log — how this app was built with Claude

A record of *how* Parallax was built using Claude Code — the workflow, the agent patterns, and the practices that worked. For a future blog post on "building a full app with an AI agent," and so the system keeps improving instead of relearning the same lessons.

---

## The setup that made it work

The repo is **AI-native by construction** — the agent's rules live in the repo, not in someone's head:

- **`CLAUDE.md`** — the contract loaded into every session: stack, commands, conventions, hard "do nots". This is the single highest-leverage file.
- **`.claude/rules/`** — hard-won specifics the agent can't infer: `frontend.md` (RN fidelity traps), `database.md` (RLS/SECURITY DEFINER), `testing.md` (no hollow tests), `workflow.md` (the auto loop), `git.md`.
- **`ARCHITECTURE.md` + `docs/`** — deep context read on demand, keeping `CLAUDE.md` lean.
- **Memory** — durable facts/learnings the agent records across sessions.

**Lesson:** time spent encoding rules up front pays back every single turn. The rules are what stop an agent from "fixing" valid RN code or shipping a hollow test.

## Driving the work: `/goal` and `/loop`

- **`/goal <condition>`** sets a session-scoped Stop hook — the agent can't stop until the condition is verifiably met. Used for things like "every flow covered by unit tests," "ready to go live," "the UI follows the design closely." It keeps the agent honest: it must produce evidence, not a claim.
- **`/loop`** runs a prompt continuously (self-paced or on an interval) — used for "keep going until the app is done." Good for long autonomous stretches.

**Lesson:** goals are most effective when the condition is *checkable* (tests green, screen matches, creds listed). Vague goals ("make it nice") give the hook nothing to verify.

## Multi-agent patterns

- **Parallel read-only audits.** To check design fidelity across screens, dispatched 5 `researcher` subagents at once — each compared one screen (FE ↔ design source) and returned a ranked, concrete diff. Read-only = no edit conflicts; parallel = fast. The controller then applied fixes sequentially.
- **Workflows for comprehensive sweeps.** Multi-stage `Workflow` runs (find → adversarially verify → synthesize) for bug/PRD audits — e.g. a 30-agent pass that generated unit tests for every screen, then verified them together.
- **Adversarial verify.** Findings get a second, skeptical pass before being treated as real — kills plausible-but-wrong conclusions.
- **Delegate verbose ops.** Long test runs / log analysis go to subagents so the main context stays clean.

**Lesson:** parallelize *independent* work (audits, finders); keep *mutations* sequential. Always verify findings before acting on them.

## Verify before claiming (the core discipline)

Nothing is "done" on inference. The standing bar for any change:

```
npx tsc --noEmit     # 0 errors
npx jest             # all green (parallel AND --runInBand for flake)
npx expo export -p ios   # bundles every route
supabase test db     # pgTAP, if SQL changed
```

Plus, for anything user-facing: **load it on the simulator and screenshot it.** A build succeeding ≠ the screen looking right. This caught real bugs (a colocated test breaking `expo export`; a timer leak crashing the suite; the half-speed logo bounce).

**Lesson:** "show the output" is non-negotiable. One false "shipped!" costs more trust than a hundred verifications cost time.

## Testing discipline

- **Test-first**, exact assertions (not `> 0` / truthy), tests must `render()` + assert real content — never `expect(<JSX/>).toBeTruthy()`.
- Pure logic (`src/domain`) is unit-tested with exact values; RLS/reveal-gate is pgTAP-proven.
- Coverage went 109 → 220 tests; the suite is stable under both parallel and `--runInBand`.

**Lesson:** hollow tests are worse than no tests — they make CI green while testing nothing. Reject them in review.

## Root-cause over patch

When something broke, the rule was: form a hypothesis, investigate, fix the cause — and after 2 failed attempts, stop and rethink instead of brute-forcing. Examples: the "flaky" suite was actually one leaked `setTimeout`; the slow logo bounce was a per-leg-vs-full-cycle semantics bug, not a per-screen tweak.

## Design source of truth via MCP

The `claude_design` MCP connector reads the design project directly (`DesignSync`), so the agent implements against the *actual* design files (`couples-*.jsx`), not a screenshot guess.

## What to improve next (see the self-improvement loop)

- Capture each non-obvious fix as a durable learning (memory + this log) so it's never relearned.
- Tighten the loop between "screenshot the running app" and "auto-detect visual drift from the design."

_This log is meant to be appended to. When a session produces a reusable lesson, add it._
