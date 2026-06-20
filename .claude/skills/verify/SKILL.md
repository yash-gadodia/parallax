---
name: verify
description: Verification before completion. Auto-triggered before any "done / fixed / passing / deployed" claim. No success claims without fresh evidence.
---

# Verify

Before you say it works, prove it. Inference is not evidence.

## Checklist

1. **Re-run the actual thing** — the test, the command, the request — after your final edit. Not from memory of an earlier run.
2. **Read the output**, don't skim. Exit 0 ≠ passing; build success ≠ deploy success; edit applied ≠ behavior changed.
3. **Re-trigger the original case** — for a bug fix, reproduce the failure and confirm it's gone.
4. **Show the evidence** — paste the command and the matched output back to the user (e.g. the passing test line, the curl response, the diff).

## Claim discipline

- Don't say "deployed" from a push exit 0 — verify the live artifact reflects the change (cache-busted fetch, grep for the new value).
- If you can't verify, say exactly what's unverified and why — don't round up to success.
- "Tests pass" requires showing the run. "Fixed" requires showing the re-run of the failing case.
