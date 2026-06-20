---
name: finish
description: Land completed work. Auto-triggered after implementation + review pass. Verifies tests, presents merge/PR/keep options, executes with safety checks.
---

# Finish

Land work cleanly — only after it's verified.

## Preconditions
- Tests green (show the run — see the `verify` skill).
- Review passed (see the `review` skill).
- Diff is scoped to the task; no stray changes.

## Steps
1. **Summarize** what changed and why, in one short paragraph.
2. **Show the diff** scope — files touched, lines added/removed.
3. **Present options** and let the user choose:
   - merge to the base branch
   - open a PR
   - keep the branch as-is
   - discard
4. **Execute** the chosen path:
   - Commit with a Conventional Commits message (`.claude/rules/git.md`), including the co-author trailer when committing on the user's behalf.
   - For a PR, write a tight body: what + why + how to test.

## Safety
- Never force-push to `main`. Confirm before any irreversible action.
- Don't commit unless the user asked, or chose merge/PR here.
- If anything is unverified, say so — don't land on a "should work".
