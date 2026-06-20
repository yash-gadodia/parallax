---
name: plan
description: Bite-sized implementation planning with a devil's advocate pass. Auto-triggered for medium+ tasks before writing code; can be invoked manually to force a planning step.
---

# Plan

Turn a goal into a plan you can execute without re-deciding mid-flight.

## Steps

1. **Restate** the goal in one sentence. If it touches 3+ files or creates a branch/PR, confirm scope before continuing.
2. **Read first** — map the change onto the existing code. Never plan against assumptions.
3. **Decompose** into steps that are each 2-5 minutes of work. For each step list:
   - exact file path(s) to create/modify
   - the test to write first (RED) and what "done" looks like
4. **Devil's advocate** — challenge the plan once: What breaks? What's the simplest version? What did I assume? Revise.
5. **Present** the numbered plan with a one-line recommendation, then implement.

## Guardrails

- Simplest plan that solves the actual problem — no speculative flexibility.
- If the stack isn't chosen yet, the first step is choosing it (and updating CLAUDE.md + ARCHITECTURE.md).
- Pair with `.claude/rules/workflow.md`.
