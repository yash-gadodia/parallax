// Parallax shared content: packs, threads, wrapped story slides, couple archetypes
// Ported from design_handoff_parallax/design_files (couples-core.jsx + couples-viral.jsx)

// ── PACKS ──────────────────────────────────────────────────────
// Themed question sets: deep (free), rest locked behind Plus

export interface Pack {
  id: string;
  emoji: string;
  title: string;
  tag: string;
  tint: string;
  locked: boolean;
}

export const PACKS: Pack[] = [
  {
    id: 'deep',
    emoji: '🌊',
    title: 'Deep end',
    tag: 'the real ones',
    tint: 'var(--p2)',
    locked: false,
  },
  {
    id: 'spicy',
    emoji: '🌶️',
    title: 'After dark',
    tag: 'flirty · 18+',
    tint: 'var(--p1)',
    locked: true,
  },
  {
    id: 'silly',
    emoji: '🎈',
    title: 'Chaos hour',
    tag: 'unserious',
    tint: 'var(--match)',
    locked: true,
  },
  {
    id: 'future',
    emoji: '🔮',
    title: 'Someday',
    tag: 'the big stuff',
    tint: 'var(--p2-deep)',
    locked: true,
  },
];

// Sample questions for each pack
export interface PackSampleMap {
  [packId: string]: string[];
}

export const PACK_SAMPLE: PackSampleMap = {
  deep: [
    'What do you think I worry about most?',
    'When did you know you liked me?',
    'What does "home" mean to you now?',
  ],
  spicy: [
    "Boldest place you'd want to kiss me?",
    "One thing you've wanted to try together?",
    'Describe last night in three words.',
  ],
  silly: [
    "If we were a sitcom couple, who's the chaos?",
    'Weirdest thing you find cute about me?',
    'Our toxic trait as a duo?',
  ],
  future: [
    'City we eventually end up in?',
    'Kids, pets, or plants first?',
    'Where do you see us in five years?',
  ],
};

// ── THREAD ────────────────────────────────────────────────────
// Comment thread seeded on a single-prompt answer

export interface ThreadMessage {
  who: string;
  text: string;
}

export interface Thread {
  promptId: string;
  q: string;
  emoji: string;
  msgs: ThreadMessage[];
  reactions: string[];
}

export const THREAD: Thread = {
  promptId: 'fri',
  q: 'Our perfect Friday night?',
  emoji: '🌙',
  msgs: [
    {
      who: 'remy',
      text: 'cozy night in?? since when 😭 you wanted to go OUT last week',
    },
    { who: 'you', text: "that was someone's birthday, it doesn't count" },
    { who: 'remy', text: 'mhm. ok my little homebody 🫶' },
  ],
  reactions: ['😭', '🫶', '😂', '🔥', '🥹'],
};

// ── WRAPPED ────────────────────────────────────────────────────
// Viral wrapped story slides (Spotify-style monthly recap)

export interface WrapSlide {
  bg: string;
  kind?: 'cover' | 'type' | 'share';
  kicker?: string;
  big?: string;
  unit?: string;
  sub?: string;
}

export const WRAP: WrapSlide[] = [
  { bg: 'linear-gradient(160deg,#FF8E7A,#9D95F5)', kind: 'cover' },
  {
    bg: 'linear-gradient(160deg,#7064E6,#C387C9)',
    kicker: 'you showed up',
    big: '28',
    unit: 'drops, together',
    sub: "You didn't miss a single Sunday this month.",
  },
  {
    bg: 'linear-gradient(160deg,#54C2A0,#9D95F5)',
    kicker: 'in perfect step',
    big: '38',
    unit: 'twin moments',
    sub: 'The times you said the exact same thing, blind. 👯',
  },
  {
    bg: 'linear-gradient(160deg,#EF6A53,#C387C9)',
    kicker: 'the one you kept missing',
    big: '🌧',
    unit: '',
    sub: '"When I\'m overwhelmed, what I need...", it took you three tries. Now you know it by heart.',
  },
  { bg: 'var(--us)', kind: 'type' },
  { bg: 'linear-gradient(160deg,#9D95F5,#FF8E7A)', kind: 'share' },
];

// ── COUPLE TYPE ARCHETYPE ─────────────────────────────────────
// Couple personality type revealed in the wrapped story

export interface CoupleType {
  name: string;
  emoji: string;
  line: string;
  body: string;
  traits: string[];
}

export const COUPLE_TYPE: CoupleType = {
  name: 'The Slow Burn',
  emoji: '🔥',
  line: "You don't say everything out loud, you let it unfold.",
  body: "Your lightest answers match instantly, but your deepest ones land on the second guess, not the first. That's not distance. That's a couple still discovering each other on purpose.",
  traits: [
    'Quietly devoted',
    'Deep over fast',
    'Curious about each other',
  ],
};
