# App Deployment — building & shipping via EAS

How to build Parallax and ship it to the **App Store** (iOS) + **Play Store** (Android) with **EAS** (Expo Application Services, expo.dev). Pairs with `docs/GO_LIVE.md`, `docs/PROD_SETUP.md`, `docs/CREDENTIALS.md`.

> ⚠️ **Public repo — no credentials here.** Expo tokens, Apple keys, DB passwords live in **1Password / EAS / the dashboards**, never in tracked files. See `docs/CREDENTIALS.md`.

## One-time EAS setup
1. Install: `npm i -g eas-cli` (or just use `npx eas-cli`).
2. **Auth:** `eas login` (interactive) — *or* set `EXPO_TOKEN=<token>` for non-interactive/CI (token from expo.dev → **Account Settings → Access Tokens**; revoke when done).
3. **Link the EXISTING repo to the EAS project** — ⚠️ do **NOT** run `npx create-expo-app` (that scaffolds a *blank* app in a subfolder; Expo's generic onboarding suggests it but it's wrong for an existing project):
   ```bash
   eas init --id <eas-project-id>     # writes extra.eas.projectId + owner into app.json
   ```
4. `eas.json` build profiles live in the repo: `development` / `preview` / `production`. Each binds to an EAS env via `"environment": "<name>"` so it picks up that environment's variables.

## ⚠️ The `.npmrc` gotcha (build dies at install in ~20s)
Parallax requires `--legacy-peer-deps` (the reanimated/worklets peer range). EAS's default `npm install` doesn't use it, so the build **errors during the install phase in ~20 seconds** with no obvious reason. Fix = a tracked `.npmrc` at repo root:
```
legacy-peer-deps=true
```
(Already committed. **If a future build fails fast at "Install dependencies", this is the first thing to check.**)

## Env vars → EAS, never the repo
Prod Supabase URL + publishable key are EAS environment variables (not committed):
```bash
eas env:create --environment preview    --name EXPO_PUBLIC_SUPABASE_URL      --value "https://<ref>.supabase.co" --visibility plaintext
eas env:create --environment preview    --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "sb_publishable_…"               --visibility sensitive
# repeat with --environment production
```
Inspect: `eas env:list preview` (or `production`).

## Android — builds with NO Apple account
```bash
eas build --platform android --profile preview --non-interactive --no-wait
```
- EAS **auto-generates the Android keystore** in the cloud on the first build (nothing to upload).
- `preview` profile → internal-distribution **`.apk`** you can install directly. Watch/download at the printed `expo.dev/.../builds/<id>` URL.

## iOS — needs an Apple Developer account
### Account: Individual vs Organization — a real ownership decision
- **Personal app → enroll Individual** (Apple Developer iPhone app or developer.apple.com). ~**US$99/yr**, shown in local currency (e.g. **~S$145** in Singapore — same standard program, not a premium tier).
- **Do NOT ship a personal app under an employer's org.** If your Apple ID is already a member of a company's Apple Developer team, the App Store **seller name, app ownership, revenue payouts, and IP** all attach to whichever team you ship under. Keep personal apps on your **own Individual team**.
- One Apple ID can belong to **multiple teams** → **always pick the right team** in EAS prompts *and* in the App Store Connect team switcher (top-right) — or it silently ships under the wrong entity.

### Hands-off iOS builds via App Store Connect API key
1. App Store Connect (team switcher set to the RIGHT team) → **Users and Access → Integrations → App Store Connect API** → create a key (**Admin** or **App Manager**) → download the **`.p8`** (one time only) + copy **Key ID** + **Issuer ID**. Store in 1Password.
2. Hand EAS the API key (so no Apple password/2FA prompts), then:
   ```bash
   eas build  --platform ios --profile production
   eas submit --platform ios --profile production    # uploads to App Store Connect → TestFlight
   ```
3. Create the **app record** in App Store Connect (bundle `com.yashgadodia.parallax`) + enable **TestFlight** for the beta.

## OTA updates (optional, recommended)
Ship JS-only fixes to installed apps **without** a rebuild/resubmit:
```bash
npx expo install expo-updates
eas update:configure
eas update --branch production --message "fix X"
```
(Without `expo-updates`, a build profile's `channel` is inert — that's the harmless warning on the first build.)

## Verify before submitting
`npm run typecheck` (0) · `npx jest` (green) · `npx expo export -p ios` (bundles) · EAS build succeeds · `eas env:list production` shows the prod vars · **Privacy Policy + Terms URLs ready** (App Store requires them — see `docs/GO_LIVE.md`).
