---
name: preview
description: Open the app on the iOS simulator and show the user. Use when they say "open the app", "preview", "show me", or want to see the current state on the phone.
---

# Preview

Get the app running on the simulator and show the user a screenshot.

1. **Check the booted sim:** `xcrun simctl list devices booted` — if none, boot one (`xcrun simctl boot "iPhone 17 Pro Max"` then `open -a Simulator`).
2. **Check Metro is running:** `curl -s http://127.0.0.1:8081/status` should say `packager-status:running`. If not, start it: `npx expo start` (background). If the `.env` Supabase URL changed, restart Metro with `--clear` so the new env is bundled.
3. **Backend up?** If the user will sign in / use data, confirm Supabase is reachable: `curl -s -m5 -o /dev/null -w "%{http_code}" "$EXPO_PUBLIC_SUPABASE_URL/rest/v1/"` → 200. If Docker/OrbStack is down, `open -a OrbStack` then `supabase start`.
4. **Launch + screenshot:** `xcrun simctl launch booted com.anonymous.parallax`, wait ~12s for the JS bundle, then `xcrun simctl io booted screenshot /tmp/preview.png` and **show the image** to the user.
5. Remind them of the fast path to sign in: tap **"I already have an account"** → `test@parallax.app` / `parallax123` (reseed with `./scripts/seed-test-user.sh` if needed).

Always end by actually displaying the screenshot — the point is for the user to *see* it.
