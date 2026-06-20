---
name: review
description: Two-stage code review — spec compliance, then code quality. Auto-triggered after implementation; review in a fresh perspective, never the session that wrote the code.
---

# Review

## Stage 1 — Spec compliance
Does the change do what was actually requested? A missing or misread requirement outranks every style nit. If it doesn't match the ask, stop here and report that.

## Stage 2 — Code quality
Only once spec is satisfied, check:
- **Correctness** — logic errors, off-by-one, null/empty handling, race conditions.
- **Security** — input validation, authz checks, injection, secrets in code.
- **Errors** — failures surfaced, not swallowed by a broad try/catch.
- **Conventions** — matches surrounding code and `.claude/rules/`.
- **Tests** — does coverage actually catch a regression?

## Reporting

- Order by severity: **blocker → should-fix → nit**.
- Each finding: `file:line` + *why* it's wrong.
- Confidence-filter — only real issues. Clean diff → say so.
- Note pre-existing problems once; don't fix them unasked.
