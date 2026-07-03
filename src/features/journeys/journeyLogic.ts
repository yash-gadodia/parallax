import type { JourneyState, JourneyTalkPrompt } from '../../types/db';

// ---------------------------------------------------------------------------
// Pure journey helpers (RN-free, exact-testable) + the demo-mode sample data.
// ---------------------------------------------------------------------------

/**
 * Defensive parse of a stage's talk_prompts jsonb: keeps only well-formed
 * {emoji, text} entries so a malformed catalog row can never crash a screen.
 */
export function parseTalkPrompts(raw: unknown): JourneyTalkPrompt[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return [];
    const { emoji, text } = item as { emoji?: unknown; text?: unknown };
    if (typeof emoji !== 'string' || typeof text !== 'string' || text.length === 0) {
      return [];
    }
    return [{ emoji, text }];
  });
}

/** 'stage 3 of 7' while walking; 'complete' once the journey is done. */
export function stageProgressLabel(
  current: number,
  total: number,
  completed: boolean
): string {
  if (completed) return 'complete';
  return `stage ${current} of ${total}`;
}

/**
 * Fraction of the journey behind the couple: completed stages / total.
 * Stage 1 of 7 = 0 (nothing behind you yet); completion = exactly 1.
 */
export function progressFraction(
  current: number,
  total: number,
  completed: boolean
): number {
  if (total <= 0) return 0;
  if (completed) return 1;
  const done = Math.min(Math.max(current - 1, 0), total);
  return done / total;
}

/**
 * The server's advance gate, mirrored for the UI: a stage can move on once
 * EITHER member has checked in (laws #8 — a quiet partner never dead-ends
 * the couple's journey), and never after completion.
 */
export function canAdvance(state: JourneyState | null): boolean {
  if (!state || !state.exists || state.completed_at) return false;
  return !!state.i_checked_in || !!state.partner_checked_in;
}

/**
 * The check-in status line under the stage check-in. Null while nobody has
 * checked in (the button speaks for itself).
 */
export function checkinStatusLine(
  state: JourneyState | null,
  partnerName: string
): string | null {
  if (!state || !state.exists) return null;
  const me = !!state.i_checked_in;
  const them = !!state.partner_checked_in;
  if (me && them) return `you both checked in ✓`;
  if (me) return `you checked in ✓ · ${partnerName} can add theirs anytime`;
  if (them) return `${partnerName} checked in ✓ · add yours, or move on together`;
  return null;
}

// ---------------------------------------------------------------------------
// Demo-mode sample (the isSample pattern): a faithful preview of the seeded
// BTO journey so the unauthenticated demo never crashes or fakes server data.
// ---------------------------------------------------------------------------

export interface SampleStage {
  position: number;
  emoji: string;
  title: string;
  kick: string;
  description: string;
  talk_prompts: JourneyTalkPrompt[];
  checkin_prompt: string;
}

export interface SampleJourney {
  id: string;
  slug: string;
  title: string;
  emoji: string;
  tagline: string;
  description: string;
  stageCount: number;
  stages: SampleStage[];
}

export const SAMPLE_JOURNEY: SampleJourney = {
  id: 'sample-bto',
  slug: 'bto',
  title: 'the bto journey',
  emoji: '🏠',
  tagline: 'from ballot night to your first morning in it',
  description:
    "singapore's longest relationship arc: you apply for a flat that doesn't exist yet, wait years while it grows out of a field, then fight about tiles. this journey keeps you two on the same page through every era — the anxious bits, the money bits, and the mattress-on-the-floor bit.",
  stageCount: 7,
  stages: [
    {
      position: 1,
      emoji: '🎲',
      title: 'ballot szn',
      kick: 'apply · pray · refresh',
      description:
        "the application is in and now it's vibes and probability. everyone has an opinion, hdb has a queue, and you two have each other. the only real job this era: want the same thing out loud.",
      talk_prompts: [
        { emoji: '🗺', text: "which estates are actually on our list — and which one is only on your mum's" },
        { emoji: '⏳', text: 'how many rounds are we honestly willing to ballot before we change the plan' },
        { emoji: '🅱️', text: 'plan b, said out loud: resale? ec? another round? panic?' },
        { emoji: '📣', text: 'who do we tell about the application — and who finds out only if we get it' },
      ],
      checkin_prompt:
        "the ballot's in. say how you're actually feeling about it — one honest sentence each.",
    },
    {
      position: 2,
      emoji: '🎟',
      title: 'queue number reveal',
      kick: 'the unit pick',
      description:
        'a queue number is a lottery ticket with homework attached. floor, facing, afternoon sun, distance to the rubbish chute — every choice here is a tiny preview of how you two decide things.',
      talk_prompts: [
        { emoji: '🌇', text: 'high floor view vs five figures saved — which one of us flinches first' },
        { emoji: '☀️', text: "west sun: dealbreaker, or 'we'll get curtains'" },
        { emoji: '🚇', text: 'closer to the mrt or closer to whose parents (careful)' },
        { emoji: '🚪', text: 'the layout call: open kitchen dreams vs where the tv / altar / cat actually goes' },
      ],
      checkin_prompt:
        "unit picked (or this round skipped). what's the one thing you compromised on for them?",
    },
    {
      position: 3,
      emoji: '🏗',
      title: 'the long wait',
      kick: 'bto u/c',
      description:
        "your flat is currently a hole in the ground with a crane over it. years of living at your parents', dates in other people's neighbourhoods, and visiting a fence to point at concrete. couples who do the wait well practise being home to each other before the address exists.",
      talk_prompts: [
        { emoji: '🏠', text: "living apart or at whose parents' till keys — and our escape-hatch ritual for when it gets much" },
        { emoji: '📅', text: 'one slab-watch date per quarter: go point at the site, eat nearby, dream a bit' },
        { emoji: '🧳', text: "what we're saving for first: reno, wedding, honeymoon — rank them together" },
        { emoji: '🫠', text: 'if the completion date slips (it might), what do we do with the extra year' },
      ],
      checkin_prompt:
        "wait check: what's one thing about not having the flat yet that's secretly been good for us?",
    },
    {
      position: 4,
      emoji: '💸',
      title: 'money talks',
      kick: 'cpf · grants · the sheet',
      description:
        'the flat is also a spreadsheet. cpf, grants, the downpayment, and the quiet question under all of it: how do we do money as an us? couples who fight about money usually skipped this era — have it on purpose.',
      talk_prompts: [
        { emoji: '🏦', text: 'joint account, split bills, or one pot — what are we actually doing' },
        { emoji: '🧾', text: "the real number: a monthly mortgage we're comfy with, not the max the bank says" },
        { emoji: '💍', text: 'wedding vs reno vs honeymoon — same pool of money, so say the priorities out loud' },
        { emoji: '🆘', text: 'if one of us loses a job mid-loan — the plan we hope we never use' },
      ],
      checkin_prompt: 'money date done? write down the one number or rule you two agreed on.',
    },
    {
      position: 5,
      emoji: '🔑',
      title: 'keys day',
      kick: "it's real now",
      description:
        'an empty flat, an echo, and a letterbox with your names on it. take the photo at the door. (and yes — the paperwork wants you married soon, so the romance is literally scheduled.)',
      talk_prompts: [
        { emoji: '📸', text: 'the keys-day ritual: first photo, first meal on the floor, first plan' },
        { emoji: '📋', text: 'the defects walk: who holds the masking tape, who writes the list' },
        { emoji: '💒', text: 'rom timeline reality check — the flat says within three months, what do we say' },
        { emoji: '🚿', text: 'what needs to work before we can camp here: a fan, wifi, one working toilet' },
      ],
      checkin_prompt:
        'you stood inside it. describe the echo — what did keys day actually feel like?',
    },
    {
      position: 6,
      emoji: '🔨',
      title: 'the reno arc',
      kick: 'id vs contractor vs us',
      description:
        'everyone warned you about this era. the group chat with the id, the tile that looked different on the sample, the third ikea trip this month. the reno tests one thing: can you two disagree about a carpentry quote and still share fries after.',
      talk_prompts: [
        { emoji: '🎨', text: 'the vibe, agreed once: japandi, warm minimal, hdb maximalist — pick it and stop re-picking' },
        { emoji: '💥', text: 'our reno fight rule: sleep on any decision above $500, no tile talk after 11pm' },
        { emoji: '🪑', text: 'the ikea protocol: list first, meatballs after, no feature-wall impulse buys' },
        { emoji: '🛋', text: "one corner each: a spot in the flat that's 100% yours, no committee" },
      ],
      checkin_prompt: 'reno pulse: what did you two disagree on this week — and how did it end?',
    },
    {
      position: 7,
      emoji: '🛏',
      title: 'move-in night',
      kick: 'mattress on the floor',
      description:
        "no bed frame yet, boxes everywhere, dinner eaten sitting on the floor. this is the part you'll tell people about in ten years. the flat took years — being home takes one night.",
      talk_prompts: [
        { emoji: '🍜', text: "first meal in the flat: cooked, dabao'd, or delivered — whatever it is, it's the tradition now" },
        { emoji: '📦', text: 'the unpacking treaty: one room at a time, and which room wins' },
        { emoji: '🖼', text: 'the first thing we hang on a wall — and where the ballot-era photo goes' },
        { emoji: '🌅', text: "tomorrow's first morning: kopi run, ikea run, or absolutely nothing" },
      ],
      checkin_prompt: "first night done. what's the moment from move-in you never want to forget?",
    },
  ],
};

// The demo's "mid-journey" state: stage 3 (the long wait) reads truest for a
// preview — deep enough to show progress, early enough to feel joinable.
export const SAMPLE_JOURNEY_STATE: JourneyState = {
  exists: true,
  couple_journey_id: 'sample-cj',
  journey_id: SAMPLE_JOURNEY.id,
  slug: SAMPLE_JOURNEY.slug,
  title: SAMPLE_JOURNEY.title,
  emoji: SAMPLE_JOURNEY.emoji,
  stage_count: SAMPLE_JOURNEY.stageCount,
  current_stage: 3,
  started_at: '2026-01-10T00:00:00Z',
  completed_at: null,
  i_checked_in: false,
  partner_checked_in: true,
  stages: [
    { position: 1, entered_at: '2026-01-10T00:00:00Z', completed_at: '2026-02-02T00:00:00Z' },
    { position: 2, entered_at: '2026-02-02T00:00:00Z', completed_at: '2026-03-15T00:00:00Z' },
    { position: 3, entered_at: '2026-03-15T00:00:00Z', completed_at: null },
  ],
};
