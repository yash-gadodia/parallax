// Money Date — the guided money conversation (0029).
// Card copy lives HERE (it's copy, not data); the server owns progress and
// the outcome. Pure module: no react, no react-native — exact-unit-tested.
//
// Hard product lines (docs/IMPROVEMENT_PLAN.md laws): this is a conversation,
// not budgeting software. No numbers required, no financial advice, no
// accounts. It ends with ONE tiny action the couple chose themselves.

export interface MoneyDateCard {
  key: string;
  emoji: string;
  title: string;
  question: string;
  hint: string;
}

export const MONEY_DATE_CARDS: MoneyDateCard[] = [
  {
    key: 'childhood',
    emoji: '🧒',
    title: 'where it started',
    question: 'what did money feel like in the home you grew up in?',
    hint: 'tight, easy, secret, loud? swap stories — no fixing, just listening.',
  },
  {
    key: 'identities',
    emoji: '🐿️',
    title: 'spender & saver',
    question: 'which one of us is which — and what do you secretly admire about how the other one does it?',
    hint: 'neither one is the wrong one. find the compliment hiding in the difference.',
  },
  {
    key: 'splurge',
    emoji: '🎈',
    title: 'the dream splurge',
    question: 'a little windfall lands tomorrow. what do you each blow it on, zero guilt?',
    hint: 'dream out loud — what someone splurges on tells you what they’re hungry for.',
  },
  {
    key: 'one-change',
    emoji: '🌱',
    title: 'one tiny change',
    question: 'if we changed one small money thing next month, what would make life feel lighter?',
    hint: 'small beats grand. you’ll pick one together on the next screen.',
  },
];

// The agreed-action step comes after the cards; server caps a session at 16
// advances, so the card deck can grow without a migration.
export const MONEY_DATE_TOTAL_STEPS = MONEY_DATE_CARDS.length + 1;

// Server-enforced limits (0029), mirrored so the UI can stop typing honestly
// instead of surfacing an RPC error after the fact.
export const AGREED_ACTION_MAX = 280;
export const CARD_NOTE_MAX = 2000;

/** Clamp a (possibly stale/overshot) server step into the deck's range. */
export function clampStep(step: number): number {
  if (!Number.isFinite(step) || step < 0) return 0;
  return Math.min(Math.floor(step), MONEY_DATE_TOTAL_STEPS - 1);
}

const MONTHS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
];

/**
 * The Us-tab row's sub-line. Null (never had one) gets the invitation;
 * a completed session gets its lowercase date, e.g. "last one · 12 jun".
 * An unparseable timestamp is treated as never — honest fallback, no "NaN".
 */
export function describeLastMoneyDate(lastCompletedAt: string | null): string {
  if (lastCompletedAt) {
    const d = new Date(lastCompletedAt);
    if (!Number.isNaN(d.getTime())) {
      return `last one · ${d.getDate()} ${MONTHS[d.getMonth()]}`;
    }
  }
  return 'a tiny money talk — no numbers needed';
}
