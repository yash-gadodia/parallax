// Parallax Refocus: AI conflict mediation for couples
// Ported from design_handoff_parallax/design_files/couples-refocus.jsx

// ── RESULT SHAPE ────────────────────────────────────────────────

export interface RefocusAngles {
  you: string;
  dani: string;
}

export interface RefocusUnderneath {
  you: string;
  dani: string;
}

export interface RefocusResult {
  agree: string[];
  angles: RefocusAngles;
  underneath: RefocusUnderneath;
  wayback: string;
  bridge: string;
}

// ── EXEMPLAR (fallback if AI analysis fails) ────────────────────

export const EXEMPLAR: RefocusResult = {
  agree: [
    'Saturday plans never actually got settled',
    'The texts turned short and cold',
    'You both went to bed upset',
  ],
  angles: {
    you: 'You were underwater at work and meant to reply once you had a real answer, the quiet wasn\'t about Dani.',
    dani: 'Dani read the silence as "I\'m not a priority," and that genuinely stung.',
  },
  underneath: {
    you: 'You need a little slack when you\'re slammed, to be trusted, not chased.',
    dani: 'Dani needs to feel chosen, especially when plans are up in the air.',
  },
  wayback: 'Neither of you stopped caring, you collided on timing and what the silence meant. A tiny "slammed, will reply tonight" keeps quiet from ever meaning "forgotten."',
  bridge: 'hey, i went quiet yesterday because work buried me, not because you weren\'t on my mind. you were never an afterthought. can we redo saturday? 🤍',
};

// ── SAMPLE DATA (for testing/demo mode) ───────────────────────────

export const DANI_SIDE = 'You said you\'d sort out Saturday and then went quiet the whole day. I felt like an afterthought, so yeah, I got short with you. I hate being left on read when it\'s about us.';

export const SAMPLE_LOG = `Me: so are we still on for saturday?
Me: helloo
Me: ok i guess not
Dani: i was literally at work??
Dani: you always do this
Me: do what
Dani: forget it. goodnight.`;

export const VOICE_TRANSCRIPT = 'Okay so… I wasn\'t ignoring her. Work completely buried me and I figured I\'d reply once I had an actual answer about Saturday. I didn\'t think going quiet for a few hours meant I didn\'t care. Then I got home and everything was already cold and I just shut down.';

// ── INTRO PROMISES (displayed at the start) ────────────────────────

export interface RefocusPromise {
  iconId: string;
  title: string;
  desc: string;
}

export const PROMISES: RefocusPromise[] = [
  {
    iconId: 'lock',
    title: 'Your words stay private',
    desc: 'Dani sees the resolution, never your raw venting.',
  },
  {
    iconId: 'us',
    title: 'Both sides, no winner',
    desc: 'The AI is a mediator, not a referee. Nobody\'s "right."',
  },
  {
    iconId: 'heart',
    title: 'A way back, together',
    desc: 'It ends with something kind you can actually say.',
  },
];

// ── INPUT MODES (text, voice, paste) ────────────────────────────────

export type RefocusMode = 'text' | 'voice' | 'paste';

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
    id: 'voice',
    emoji: '🎙️',
    label: 'Voice note',
    desc: 'Just talk, we\'ll transcribe it',
  },
  {
    id: 'paste',
    emoji: '💬',
    label: 'Paste your texts',
    desc: 'Drop the actual conversation in',
  },
];
