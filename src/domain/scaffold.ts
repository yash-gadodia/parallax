export type SlotKey = 'they' | 'i' | 'then' | 'hear';

export type SlotValues = Partial<Record<SlotKey, string>>;

/** The clause each slot completes, in the order they read as one sentence. */
const CLAUSES: { key: SlotKey; prefix: string }[] = [
  { key: 'they', prefix: 'They' },
  { key: 'i', prefix: 'Then I' },
  { key: 'then', prefix: 'Then' },
  { key: 'hear', prefix: 'I wanted them to say' },
];

function filled(slots: SlotValues, key: SlotKey): string {
  return (slots[key] ?? '').trim();
}

/**
 * The scaffold slots plus whatever was typed, as the single account the model
 * reads. Tapping four chips is a complete input on its own; the free text is
 * where the specificity comes from when there is any.
 */
export function composeScaffold(slots: SlotValues, freeText: string): string {
  const sentence = CLAUSES.filter((c) => filled(slots, c.key))
    .map((c) => `${c.prefix} ${filled(slots, c.key)}.`)
    .join(' ');
  const typed = freeText.trim();
  if (sentence && typed) return `${sentence}\n\n${typed}`;
  return sentence || typed;
}

/**
 * One chip is enough — a person must be able to reach an output having typed
 * nothing. Free text on its own still needs more than a couple of characters,
 * which is the guard this screen always had.
 */
export function scaffoldReady(slots: SlotValues, freeText: string): boolean {
  const anySlot = CLAUSES.some((c) => filled(slots, c.key));
  return anySlot || freeText.trim().length > 3;
}
