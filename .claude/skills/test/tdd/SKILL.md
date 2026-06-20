---
name: tdd
description: RED-GREEN-REFACTOR cycle with rationalization prevention. Auto-triggered during implementation. Enforces test-FIRST, not test-after.
---

# TDD

Test-first, every time. The test is the spec.

## The cycle

1. **RED** — write one failing test that captures the desired behavior. Run it; confirm it fails for the *right reason*.
2. **GREEN** — write the smallest code that makes it pass. No more.
3. **REFACTOR** — with the test green, clean up only what you touched. Re-run.

Repeat per behavior. Run the full suite before declaring done.

## Rationalization stop-list

If you catch yourself thinking any of these — stop and write the test first:

| Thought | Reality |
|---------|---------|
| "It's too simple to test" | Simple code regresses too. One assertion is enough. |
| "I'll add tests after" | After = never, or after-the-bug. Test first. |
| "I'll just check it manually" | Manual checks don't run in CI. Encode it. |
| "The test is hard to write" | Hard-to-test = bad design. Fix the design. |

## Rules

- Assert exact expected values for known inputs (floats: close-comparison with a specific value).
- One framework, one import style — match `.claude/rules/testing.md`.
- Test command: `TODO` (set once the framework is chosen).
