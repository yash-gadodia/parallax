---
paths: ["app/**", "src/components/**", "src/design/**"]
---

# React Native fidelity (hard-won — these caused real visual bugs)

Porting the web prototype (`design_handoff_parallax/`) to RN. The traps that bit us, in priority order:

- **`lineHeight` is PIXELS, not a CSS multiplier.** `lineHeight: 1.5` clips text to a ~1.5px sliver (invisible). Use `lineHeight: fontSize * ~1.4` (e.g. 14px → 20, button 16.5 → 20). This made descriptions and button labels invisible.
- **Every `<Text>` needs its own explicit `color`.** RN does NOT inherit color from a parent `<View>` (default is black). White-on-dark buttons rendered invisible until each Text got `color`.
- **Reuse the atom library in `src/components`** (Btn, Press, Chip, Tok, Peek, Wordmark/Slashes, Mark, Ring, GradientText, Icon+ICONS, Sheet, Toast, TopBar, Stat, Card, DawnBlobs, Float, TabBar). Do NOT reimplement them. Tokens from `src/design/tokens` (colors/gradients/shadows/radius/space) + `typography` (fontFamily, kickStyle) — no hardcoded hex that duplicates a token.
- **Web→RN swaps:** gradient text → `<GradientText>` (MaskedView), not `-webkit-background-clip`; frosted blur → `expo-blur`; radial-gradient depth → `<DawnBlobs>`; CSS keyframes → Reanimated (`<Float>` for the gentle bob); SVG → react-native-svg; `inset:0` is not an RN style key → use `position:'absolute', top/left/right/bottom:0` or `StyleSheet.absoluteFillObject`; `pointerEvents` is a PROP, not a style key.
- **No fake phone frame / status bar** (prototype scaffolding) — use real safe-area insets (`react-native-safe-area-context`). Exception: the deliberate `homeScreen` springboard mock.
- **Floating tab bar**: it's an absolute overlay sibling to `<Tabs>` (default bar hidden), full-width via `Dimensions`, NOT react-navigation's `tabBar` wrapper (that cramped it). Tab screens need bottom padding so content/CTAs clear the floating pill.
- **Wordmark `para//ax`**: the two slashes are skewed `<View>`s lifted to the text baseline (`marginBottom ≈ size*0.22`) since RN `flex-end` aligns to the text box bottom (below the baseline by the serif's descent).
- **TypeScript**: no `any` / `@ts-ignore`. Avoid defensive `try/catch` around `Animated.createAnimatedComponent` (it's reliable).

## Reload caveat (Expo Go on the simulator)
Component edits hot-reload via Fast Refresh, but **route `_layout` / structural changes need a full reload** and Expo Go caches the bundle — a deep-linked re-open may show stale JS. Verify a layout change with `npx expo export` (bundles all routes) and/or a manual reload (shake → Reload). `osascript` keystroke injection is blocked, so headless reload isn't reliable.
