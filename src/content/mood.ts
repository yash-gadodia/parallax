// V2 F1 mood check (V2_PLAN §10): the daily temperature greeting on Today.
// copy: Dani pass pending — every string below is a working placeholder until
// her real-couple validation. Day-words, never verdict-words.

export type Mood = 'golden' | 'good' | 'off' | 'heavy';

export const MOODS: { key: Mood; emoji: string; label: string }[] = [
  { key: 'golden', emoji: '🌞', label: 'golden' },
  { key: 'good', emoji: '🙂', label: 'good' },
  { key: 'off', emoji: '🌫️', label: 'off' },
  { key: 'heavy', emoji: '🌧️', label: 'heavy' },
];

export const MOOD_COPY = {
  kick: 'how are we today?',
  // transient ack after a bright pick — the card is gone next open
  ack: 'noted ✓',
  // rough pick → the quiet offer (explicit opt-in, never auto-funnel)
  offerLine: 'want to talk it through first?',
  offerTalk: "let's talk",
  offerDismiss: 'not now',
};
