import {
  AGREED_ACTION_MAX,
  CARD_NOTE_MAX,
  MONEY_DATE_CARDS,
  MONEY_DATE_TOTAL_STEPS,
  clampStep,
  describeLastMoneyDate,
} from './cards';

describe('MONEY_DATE_CARDS', () => {
  it('is a 4-card deck plus the agreed-action step (5 total)', () => {
    expect(MONEY_DATE_CARDS).toHaveLength(4);
    expect(MONEY_DATE_TOTAL_STEPS).toBe(5);
  });

  it('covers the four conversation beats in order', () => {
    expect(MONEY_DATE_CARDS.map((c) => c.key)).toEqual([
      'childhood',
      'identities',
      'splurge',
      'one-change',
    ]);
  });

  it('every card has an emoji, title, question and hint', () => {
    for (const card of MONEY_DATE_CARDS) {
      expect(card.emoji.length).toBeGreaterThan(0);
      expect(card.title.length).toBeGreaterThan(0);
      expect(card.question.endsWith('?')).toBe(true);
      expect(card.hint.length).toBeGreaterThan(0);
    }
  });

  it('never asks for numbers, accounts or advice (conversation-only law)', () => {
    const text = MONEY_DATE_CARDS.map((c) => `${c.question} ${c.hint}`)
      .join(' ')
      .toLowerCase();
    for (const banned of ['budget', 'invest', 'salary', 'debt', 'account', '$', '%']) {
      expect(text.includes(banned)).toBe(false);
    }
  });

  it('mirrors the server limits from 0029', () => {
    expect(AGREED_ACTION_MAX).toBe(280);
    expect(CARD_NOTE_MAX).toBe(2000);
  });
});

describe('clampStep', () => {
  it('passes through in-range steps', () => {
    expect(clampStep(0)).toBe(0);
    expect(clampStep(3)).toBe(3);
  });

  it('clamps the action step and anything past it to the last step', () => {
    expect(clampStep(4)).toBe(4);
    expect(clampStep(5)).toBe(4);
    expect(clampStep(16)).toBe(4);
  });

  it('floors fractional steps and zeroes negatives and NaN', () => {
    expect(clampStep(2.9)).toBe(2);
    expect(clampStep(-1)).toBe(0);
    expect(clampStep(Number.NaN)).toBe(0);
  });
});

describe('describeLastMoneyDate', () => {
  it('invites a first money date when there has never been one', () => {
    expect(describeLastMoneyDate(null)).toBe('a tiny money talk — no numbers needed');
  });

  it('formats the last completed date as a lowercase day + month', () => {
    expect(describeLastMoneyDate('2026-06-12T09:30:00.000Z')).toBe('last one · 12 jun');
  });

  it('handles a december date (month index edge)', () => {
    expect(describeLastMoneyDate('2025-12-01T00:00:00.000Z')).toBe('last one · 1 dec');
  });

  it('treats an unparseable timestamp as never (no NaN in the UI)', () => {
    expect(describeLastMoneyDate('not-a-date')).toBe('a tiny money talk — no numbers needed');
  });
});
