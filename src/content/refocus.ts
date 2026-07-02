// Parallax Refocus: a solo reflection tool — untangle your side of a rough
// moment. The AI only ever sees the user's own words; it never invents or
// speaks for the partner. (The genuine two-sided flow is Phase 4.6.)

// ── RESULT SHAPE ────────────────────────────────────────────────

export interface RefocusResult {
  happened: string[];
  angles: string[];
  underneath: string;
  wayback: string;
  bridge: string;
}

// ── INTRO PROMISES (displayed at the start) ────────────────────────

export interface RefocusPromise {
  iconId: string;
  title: string;
  desc: string;
}

export const PROMISES: RefocusPromise[] = [
  {
    iconId: 'lock',
    title: 'Your words stay yours',
    desc: 'Nothing is sent to your partner. Only the AI reads this.',
  },
  {
    iconId: 'us',
    title: 'Your side, in focus',
    desc: 'What happened, what\'s underneath, no judgement.',
  },
  {
    iconId: 'heart',
    title: 'A kind way to raise it',
    desc: 'It ends with words you could actually say, if you choose to.',
  },
];

// ── INPUT MODES (text, paste) ────────────────────────────────────

export type RefocusMode = 'text' | 'paste';

export interface RefocusModeOption {
  id: RefocusMode;
  emoji: string;
  label: string;
  desc: string;
}

export const MODES: RefocusModeOption[] = [
  {
    id: 'text',
    emoji: '✍️',
    label: 'Type it out',
    desc: 'Say what happened in your own words',
  },
  {
    id: 'paste',
    emoji: '💬',
    label: 'Paste your texts',
    desc: 'Drop the actual conversation in',
  },
];
