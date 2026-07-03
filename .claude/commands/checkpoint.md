---
description: Run all the gates, then commit + pull --rebase + push, and report in plain English
---

Checkpoint the current work safely. Never push red code; never claim success without showing the run. Mirrors `.claude/rules/git.md`.

## 1. Gates (run fresh, show output)

- `npx jest` → all green
- `npx tsc --noEmit` → 0 errors
- `npx expo export -p ios` → bundles
- `supabase test db` → **only if SQL/migrations were touched** (reset first if the local DB is dirty)

If anything fails: stop, tell the user plainly what's broken (in non-technical terms if the user is Dani), and fix it before committing. Never `--no-verify`, never skip or weaken a test to get green.

## 2. Commit + push (main branch only — no feature branches, no PRs)

```
git add <the files you changed>   # never `git add -A` blindly; never .env/secrets
git commit -m "<conventional message>"   # feat:/fix:/docs:/chore:, imperative, ≤72 chars, co-author trailer per .claude/rules/git.md
git pull --rebase origin main     # another session may have pushed
git push origin main
```

If the rebase conflicts, resolve carefully (their pushed work + this work both survive), re-run the gates, then push.

## 3. Report in plain English

One or two lines: what was saved (in user-visible terms), that all checks passed, and the short commit hash. Example: "Saved: the new travel drop pack + the bigger Get-started button. All checks green (`a1b2c3d`)."
