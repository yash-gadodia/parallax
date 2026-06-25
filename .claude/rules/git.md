# Git

> 🚧 Skeleton — confirm against real history once commits exist, then run `/update`.

- **Commit format**: Conventional Commits — `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`. Subject in imperative mood, ≤ 72 chars.
- **Granularity**: small, focused commits. One logical change per commit.
- **When to commit**: only when the user asks. Don't auto-commit after edits.
- **Branching**: work **directly on `main`** — single branch. Do NOT create feature branches and do NOT open PRs (Yash's standing instruction, 2026-06-25). Never offer to open a PR.
- **Never**: `--no-verify`, force-push to `main`, or commit secrets (`.env`, `*.pem`, `*.key`, credentials — a hook blocks writes to these).
- **Co-author trailer** (when committing on the user's behalf):
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
