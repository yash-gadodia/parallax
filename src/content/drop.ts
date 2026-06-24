// Parallax daily-loop content: today's DROP and past ARCHIVE
// DROP is the daily 3-prompt structure; ARCHIVE is history for the Us tab and detail views

export type PromptSpice = 'sweet' | 'flirty' | 'spicy';

export interface Prompt {
  id: string;
  emoji: string;
  q: string;
  opts: string[];
  remy: number;
  remyHunch: number;
  // DEMO: your own pick + hunch shown when reveal is opened solo (no real play yet),
  // tuned so the demo reveal lands one twin, one good guess, one miss.
  youDemo: number;
  youHunchDemo: number;
  note: [string, string, string];
  why: string;
  spice: PromptSpice;
}

export interface Drop {
  code: string;
  day: string;
  title: string;
  blurb: string;
  prompts: Prompt[];
}

export interface ArchiveEntry {
  code: string;
  title: string;
  day: string;
  wave: number;
  twins: number;
  emoji: string;
  rows: [string, string, string, boolean][];
}

// Today's drop: 3 flirty-tasteful prompts
// A daily drop is a mini Aron arc: light → personal → vulnerable, both answering
// about themselves. Predicting their answer IS a Gottman love-map test. The miss is
// the gift, a wrong guess is tonight's conversation, not a failure.
export const DROP: Drop = {
  code: 'DROP 27',
  day: 'Sunday',
  title: 'soft launch',
  blurb: 'Three questions built to open something, light, then deeper. Answer for you, then guess them.',
  prompts: [
    {
      id: 'care',
      emoji: '☕',
      q: 'I feel most taken care of when you...',
      opts: [
        'bring me a drink before I ask',
        'quietly handle a thing so I don\'t have to',
        'check in on me midday',
        'let me rant with zero fixing',
        'just sit close, no words',
      ],
      remy: 1,
      remyHunch: 4,
      youDemo: 1,
      youHunchDemo: 1,
      note: [
        'Same instinct for care. Rare and lovely.',
        'You knew exactly how they want to be held.',
        'Wrong guess, so now you know. Go do that one tonight.',
      ],
      why: 'Feeling loved hinges on being cared for the way you need, not the way they\'d care. (Gottman, love maps)',
      spice: 'sweet',
    },
    {
      id: 'low',
      emoji: '🌧',
      q: 'When I\'m overwhelmed, what I really need is...',
      opts: [
        'space, alone, for a bit',
        'you near me, not fixing it',
        'to talk the whole thing out',
        'to be pulled out of my head',
        'to hear that we\'re okay',
      ],
      remy: 1,
      remyHunch: 0,
      youDemo: 3,
      youHunchDemo: 1,
      note: [
        'You weather storms the same way.',
        'You read their storm right, most partners don\'t.',
        'Missed, and this is the one worth getting right.',
      ],
      why: 'Couples misread each other\'s stress needs more than almost anything. Asking beats assuming.',
      spice: 'sweet',
    },
    {
      id: 'unsaid',
      emoji: '🔓',
      q: 'Something I think but almost never say out loud...',
      opts: [
        'that I\'m "too much"',
        'that I\'m not enough',
        'where we\'re actually headed',
        'a dream I haven\'t told you',
        'how much I really need you',
      ],
      remy: 3,
      remyHunch: 1,
      youDemo: 0,
      youHunchDemo: 0,
      note: [
        'You both carry the same quiet thing. Say it.',
        'You saw what they don\'t say. That\'s intimacy.',
        'You didn\'t see it coming, which is exactly why it matters.',
      ],
      why: 'Naming the unsaid is the quiet fast-track to closeness. (Aron, 36 questions)',
      spice: 'flirty',
    },
  ],
};

// Past drops, feed the Us history + drop detail
export const ARCHIVE: ArchiveEntry[] = [
  {
    code: 'DROP 26',
    title: 'the ick list',
    day: 'yesterday',
    wave: 88,
    twins: 2,
    emoji: '😬',
    rows: [
      ['Biggest ick?', 'Bad texter', 'Bad texter', true],
      ['My worst habit?', 'I\'m always late', 'I overthink', false],
      ['Dealbreaker?', 'No ambition', 'No ambition', true],
    ],
  },
  {
    code: 'DROP 25',
    title: 'future tense',
    day: '2 days ago',
    wave: 74,
    twins: 1,
    emoji: '🔮',
    rows: [
      ['Dream city?', 'Lisbon', 'Lisbon', true],
      ['Kids someday?', 'Maybe two', 'Definitely', false],
      ['First big buy?', 'A trip', 'A home', false],
    ],
  },
  {
    code: 'DROP 24',
    title: 'red flags',
    day: '3 days ago',
    wave: 80,
    twins: 2,
    emoji: '🚩',
    rows: [
      ['My red flag?', 'Too competitive', 'Too competitive', true],
      ['Your love language?', 'Touch', 'Quality time', false],
      ['Fight style?', 'Talk it out', 'Talk it out', true],
    ],
  },
];
