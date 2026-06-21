// Parallax "Us" tab content: Love Map learnings, mastery levels, activity feed, and streak milestones
// Sourced from fights (refocus) AND daily drops; mastery grows as it's reinforced.

export interface Learning {
  id: string;
  who: 'you' | 'dani';
  emoji: string;
  need: string;
  detail: string;
  from: 'refocus' | 'drop';
  origin: string;
  when: string;
  mastery: 0 | 1 | 2 | 3;
  becameQ: string | null;
}

export const LEARNINGS: Learning[] = [
  {
    id: 'chosen',
    who: 'dani',
    emoji: '🤍',
    need: 'Feels chosen when plans are locked in early',
    detail: 'Open-ended weekends read as "I\'m not a priority."',
    from: 'refocus',
    origin: 'the Saturday silence',
    when: 'today',
    mastery: 0,
    becameQ: 'When the weekend\'s wide open, what\'s one small thing that makes Dani feel chosen?',
  },
  {
    id: 'slack',
    who: 'you',
    emoji: '🌊',
    need: 'Needs slack when slammed, to be trusted, not chased',
    detail: 'Going quiet is bandwidth, never distance.',
    from: 'refocus',
    origin: 'the Saturday silence',
    when: 'today',
    mastery: 0,
    becameQ: null,
  },
  {
    id: 'stress',
    who: 'dani',
    emoji: '🌧',
    need: 'When overwhelmed, wants you near, not fixing it',
    detail: 'Presence over solutions.',
    from: 'drop',
    origin: 'DROP 22 · stress styles',
    when: 'last week',
    mastery: 2,
    becameQ: null,
  },
  {
    id: 'touch',
    who: 'you',
    emoji: '🫶',
    need: 'Feels most loved through small acts, not big words',
    detail: 'A made coffee says more than a paragraph.',
    from: 'drop',
    origin: 'DROP 19 · love languages',
    when: '3 weeks ago',
    mastery: 3,
    becameQ: null,
  },
];

// The 4 mastery labels: how well you're reinforcing each learning
export const MASTERY = ['just learned', 'getting it', 'second nature', 'you\'ve got this'] as const;

export interface Activity {
  id: string;
  kind: 'played' | 'nudge' | 'milestone' | 'pack' | 'refocus' | 'reveal';
  who: 'you' | 'dani' | 'us';
  emoji: string;
  title: string;
  body: string;
  when: string;
  unread: boolean;
  cta: 'play' | 'streak' | 'packs' | 'lovemap' | null;
}

// Activity pulse, the two-player back-and-forth (Duolingo red-dot trigger)
export const ACTIVITY: Activity[] = [
  {
    id: 'a1',
    kind: 'played',
    who: 'dani',
    emoji: '💌',
    title: 'Dani played today\'s drop',
    body: 'Your turn, no peeking at theirs.',
    when: 'just now',
    unread: true,
    cta: 'play',
  },
  {
    id: 'a2',
    kind: 'nudge',
    who: 'dani',
    emoji: '👋',
    title: 'Dani nudged you',
    body: '"come do today\'s one with me 🥺"',
    when: '2h ago',
    unread: true,
    cta: 'play',
  },
  {
    id: 'a3',
    kind: 'milestone',
    who: 'us',
    emoji: '🔥',
    title: 'You hit a 23-day streak',
    body: 'Next milestone: 30 days. Don\'t break it now.',
    when: 'today',
    unread: false,
    cta: 'streak',
  },
  {
    id: 'a4',
    kind: 'pack',
    who: 'dani',
    emoji: '🌊',
    title: 'Dani sent you a pack',
    body: 'Deep end · 3 of the real questions.',
    when: 'yesterday',
    unread: false,
    cta: 'packs',
  },
  {
    id: 'a5',
    kind: 'refocus',
    who: 'us',
    emoji: '🤍',
    title: 'You refocused "the Saturday silence"',
    body: 'Added 2 things to your Love Map.',
    when: '2 days ago',
    unread: false,
    cta: 'lovemap',
  },
  {
    id: 'a6',
    kind: 'reveal',
    who: 'us',
    emoji: '👯',
    title: 'A twin moment on DROP 26',
    body: 'You both said "bad texter." Iconic.',
    when: '2 days ago',
    unread: false,
    cta: null,
  },
];

// Streak milestone track: days to unlock badges/unlocks
export const MILES = [7, 30, 50, 100, 365] as const;
