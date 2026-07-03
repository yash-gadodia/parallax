// Parallax shared content: packs, threads, wrapped story slides, couple archetypes
// Ported from design_handoff_parallax/design_files (couples-core.jsx + couples-viral.jsx)

// ── PACKS ──────────────────────────────────────────────────────
// Themed question sets: deep (free), rest locked behind Plus.
// `theme` is the drops.theme value in the live catalog (0015) — samples and
// send_pack both key off it, so every pack maps to real content.

export interface Pack {
  id: string;
  emoji: string;
  title: string;
  tag: string;
  tint: string;
  locked: boolean;
  theme: string;
}

export const PACKS: Pack[] = [
  {
    id: 'deep',
    emoji: '🌊',
    title: 'Deep end',
    tag: 'the real ones',
    tint: 'var(--p2)',
    locked: false,
    theme: 'deeper',
  },
  {
    id: 'spicy',
    emoji: '🌶️',
    title: 'After dark',
    tag: 'flirty · 18+',
    tint: 'var(--p1)',
    locked: true,
    theme: 'spicy',
  },
  {
    id: 'silly',
    emoji: '🎈',
    title: 'Chaos hour',
    tag: 'unserious',
    tint: 'var(--match)',
    locked: true,
    theme: 'fun',
  },
  {
    id: 'memory',
    emoji: '📼',
    title: 'Rewind',
    tag: 'the way back',
    tint: 'var(--p2-deep)',
    locked: true,
    theme: 'memory',
  },
];

