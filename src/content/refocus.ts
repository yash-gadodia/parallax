// Parallax Refocus: two honest modes.
// SOLO — untangle your side of a rough moment. The AI only ever sees the
// user's own words; it never invents or speaks for the partner.
// TWO-SIDED (4.6) — both partners add their REAL side to a persisted session;
// the AI mediates only once both sides exist (shared ground, each side's
// underneath, one kind bridge each). It never invents a side.
// Both modes run the safety screening stack first (see the edge function).

// ── RESULT SHAPES ───────────────────────────────────────────────

export interface RefocusResult {
  happened: string[];
  angles: string[];
  underneath: string;
  wayback: string;
  bridge: string;
  // Set by the edge fn when the safety screening pass could not run (API
  // error): reflection proceeded, and the client appends the resources note.
  screening_unavailable?: boolean;
}

// The two-sided mediation, stored verbatim in refocus_sessions.ai_result so
// both partners render the SAME result.
export interface RefocusMediation {
  type: 'mediation';
  shared_ground: string;
  initiator_underneath: string;
  partner_underneath: string;
  initiator_bridge: string;
  partner_bridge: string;
  screening_unavailable?: boolean;
}

export interface RefocusHelpline {
  name: string;
  contact: string;
}

// Crisis / abuse-signal responses are static server copy (never
// LLM-improvised) — the client only renders what the server sent.
export interface RefocusSafety {
  type: 'crisis' | 'abuse';
  title: string;
  message: string;
  helplines: RefocusHelpline[];
}

export type RefocusAiResult = RefocusMediation | RefocusSafety;

export type RefocusSessionState =
  | 'waiting_partner'
  | 'ready'
  | 'revealed'
  | 'expired';

// ── DISCLOSURE COPY (every AI result carries both lines) ─────────

export const AI_DISCLOSURE = 'Written by AI, and it reads like it cares, but it isn\'t a person.';

export const THERAPY_DISCLAIMER =
  'Refocus helps you talk it through, it isn\'t therapy. For the heavy stuff, please reach for a real pro. 🤍';

// Shown when the safety screening pass failed (API error) and we proceeded
// anyway — the honest fallback for the fail-open tradeoff.
export const SCREENING_UNAVAILABLE_NOTE =
  'Our safety check couldn\'t run this time. If anything here touches on safety or crisis, please reach a human: SOS 1767 (SG) or findahelpline.com.';

// ── INTRO PROMISES (displayed at the start) ────────────────────────

export interface RefocusPromise {
  iconId: string;
  title: string;
  desc: string;
}

export const PROMISES: RefocusPromise[] = [
  {
    iconId: 'lock',
    title: 'Your raw words stay yours',
    desc: 'Only the AI reads them. Together mode shares the middle ground, never your words.',
  },
  {
    iconId: 'us',
    title: 'No sides taken',
    desc: 'What\'s underneath for each of you, no judgement, no verdicts.',
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
