// V2 F2 repair check-in (V2_PLAN §10): the day-after follow-up to a rough
// moment. copy: Dani pass pending — every string is a working placeholder
// until her real-couple validation. Warm, never clinical, never a verdict.

export type RepairVerdict = 'yes' | 'getting_there' | 'still_tender';

export const REPAIR_VERDICTS: { key: RepairVerdict; emoji: string; label: string }[] = [
  { key: 'yes', emoji: '💛', label: 'yes' },
  { key: 'getting_there', emoji: '🌤️', label: 'getting there' },
  { key: 'still_tender', emoji: '🌫️', label: 'still tender' },
];

export const REPAIR_COPY = {
  kick: 'checking in',
  title: 'yesterday was a lot. did you two find your way back?',
  sub: 'answer privately — you see each other’s the moment you both have.',
  waiting: (partnerName: string) =>
    `your answer is in · you’ll both see them when ${partnerName} answers`,
  revealKick: 'you both answered',
  // mutual "yes" — the milestone-warm peak of the loop
  repairLine: 'that’s a repair. most couples never learn to do that.',
  gettingThereLine: 'finding your way back, together. that counts.',
  tenderLine: 'still tender is honest. no rush — the way back is still there.',
  roundTwo: 'talk it through again',
  dismiss: 'close',
  // 48h one-sided fallback → private reflection note
  reflectionKick: 'just for you',
  reflectionPrompt: 'what did this one teach you?',
  reflectionSub: 'saved privately to your Love Map — never shown to your partner.',
  reflectionSave: 'keep it',
  reflectionSaved: 'saved, just for you 🤍',
};
