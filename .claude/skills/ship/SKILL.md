---
name: ship
description: Verify, commit, and push the current work. Use when the user says "ship it", "save this", "push it", or wants their changes saved to GitHub.
---

# Ship

Land the current changes safely. Never push red code.

1. **Verify first** (show the output, don't infer):
   - `npx tsc --noEmit` → 0 errors
   - `npx jest` → all green
   - `npx expo export -p ios` → bundles
   - `supabase test db` → only if SQL/migrations changed
2. If anything fails, **stop and fix it** before committing — tell the user plainly what's broken. Don't ship around a failure.
3. **Commit** with a Conventional Commit message (`feat:`/`fix:`/`docs:`/…), subject in imperative mood ≤72 chars, and the co-author trailer:
   `Co-Authored-By: Claude <noreply@anthropic.com>`
4. **Push** directly to `main` (`git pull --rebase origin main` first) — single-branch repo, no feature branches, no PRs (see .claude/rules/git.md).
5. Report back in one line: what shipped + the short commit hash + that checks passed (e.g. "shipped `a722728` — Us screen fidelity, tsc/jest/export green").

Keep it calm for a non-technical user: if everything's green, just do it and confirm. Only surface details when something actually blocks the push.
