# Backlog (the shared task tracker)

`docs/BACKLOG.md` is the source of truth for what's planned. Owners are tagged inline: `(Yash)` creds/infra · `(Dani)` product/design decisions · `(Claude)` agent-buildable.

Keep it current as part of normal work:

- **"work on the backlog" / "do the next thing"** → pick the **top unblocked `(Claude)` task in `To do`**, move it to **In progress**, implement it test-first and verify (tsc + jest + the relevant check), then check it off, move it to **Done** with the commit hash, and report what shipped.
- **Routing:** when the user adds a request in plain words, file it under the right owner. If something tagged `(Claude)` actually needs a credential or external account, **reassign it to `(Yash)`** with a one-line note on what's needed. If it needs a product/design call, **reassign to `(Dani)`**.
- **Discovery:** when work surfaces a real follow-up (a gap, a TODO, a deferred fix), add it to `To do` with the right owner rather than letting it vanish.
- Only mark a task **Done** with real evidence (it shipped + verified) — never aspirationally. This mirrors `.claude/rules/self-improvement.md`.
- Don't touch `(Yash)`/`(Dani)` items except to clarify or reassign — those are theirs to complete.
