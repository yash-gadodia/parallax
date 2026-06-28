---
paths: ["app/**", "src/components/**", "src/design/**"]
---

# React Native fidelity (hard-won — these caused real visual bugs)

Porting the web prototype (`design_handoff_parallax/`) to RN. The traps that bit us, in priority order:

- **`lineHeight` is PIXELS, not a CSS multiplier.** `lineHeight: 1.5` clips text to a ~1.5px sliver (invisible). Use `lineHeight: fontSize * ~1.4` (e.g. 14px → 20, button 16.5 → 20). This made descriptions and button labels invisible.
- **Every `<Text>` needs its own explicit `color`.** RN does NOT inherit color from a parent `<View>` (default is black). White-on-dark buttons rendered invisible until each Text got `color`.
- **`letterSpacing`/spacing inside size-parameterized atoms must be em-relative, not hardcoded px.** A hardcoded `letterSpacing: 0.25` is right at `size=25` but wrong when the atom renders at `size=64` — use `size * 0.01`. Same for an atom's internal gaps (express as `h * factor`). The design's `0.14em` → `fontSize * 0.14`. (Wordmark: hardcoded letterSpacing didn't scale; the `//` slashes' inter-gap must equal the letter gaps for even spacing; their `marginBottom ≈ size*0.22` to sit on the baseline.)
- **Reuse the atom library in `src/components`** (Btn, Press, Chip, Tok, Peek, Wordmark/Slashes, Mark, Ring, GradientText, Icon+ICONS, Sheet, Toast, TopBar, Stat, Card, DawnBlobs, Float, TabBar). Do NOT reimplement them. Tokens from `src/design/tokens` (colors/gradients/shadows/radius/space) + `typography` (fontFamily, kickStyle) — no hardcoded hex that duplicates a token.
- **Web→RN swaps:** gradient text → `<GradientText>` (MaskedView), not `-webkit-background-clip`; frosted blur → `expo-blur`; radial-gradient depth → `<DawnBlobs>`; a `linear-gradient(...)`/`radial-gradient(...)` **string** is NOT a valid RN `backgroundColor`/`color` (renders nothing) → use `expo-linear-gradient`; CSS keyframes → Reanimated (`<Float>` for the gentle bob); SVG → react-native-svg; `pointerEvents` is a PROP, not a style key. NOTE: `inset` and `display:'flex'` **are** valid in RN 0.71+ (`inset` is the top/right/bottom/left shorthand; flex is the default) — do not "fix" them.
- **No fake phone frame / status bar** (prototype scaffolding) — use real safe-area insets (`react-native-safe-area-context`). Exception: the deliberate `homeScreen` springboard mock.
- **Floating tab bar**: it's an absolute overlay sibling to `<Tabs>` (default bar hidden), full-width via `Dimensions`, NOT react-navigation's `tabBar` wrapper (that cramped it). Tab screens need bottom padding so content/CTAs clear the floating pill.
- **Wordmark `para//ax`**: the two slashes are skewed `<View>`s lifted to the text baseline (`marginBottom ≈ size*0.22`) since RN `flex-end` aligns to the text box bottom (below the baseline by the serif's descent).
- **TypeScript**: no `any` / `@ts-ignore`. Avoid defensive `try/catch` around `Animated.createAnimatedComponent` (it's reliable).

## Reload caveat (Expo Go on the simulator)
Component edits hot-reload via Fast Refresh, but **route `_layout` / structural changes need a full reload** and Expo Go caches the bundle — a deep-linked re-open may show stale JS. Verify a layout change with `npx expo export` (bundles all routes) and/or a manual reload (shake → Reload). `osascript` keystroke injection is blocked, so headless reload isn't reliable.
