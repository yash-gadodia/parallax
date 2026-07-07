import { coupleLocalDateKey, isRoughMood, moodCardState } from './moodLogic';

describe('isRoughMood', () => {
  it('flags exactly off and heavy as rough', () => {
    expect(isRoughMood('golden')).toBe(false);
    expect(isRoughMood('good')).toBe(false);
    expect(isRoughMood('off')).toBe(true);
    expect(isRoughMood('heavy')).toBe(true);
  });
});

describe('coupleLocalDateKey', () => {
  // 2026-07-07T23:30:00Z = 2026-07-08 07:30 in Singapore (+08).
  const lateUtc = new Date('2026-07-07T23:30:00Z');

  it('computes the date in the couple tz, not UTC', () => {
    expect(coupleLocalDateKey(lateUtc, 'Asia/Singapore')).toBe('2026-07-08');
    expect(coupleLocalDateKey(lateUtc, 'UTC')).toBe('2026-07-07');
  });

  it('is DST-safe for a US timezone', () => {
    // 2026-03-08 06:30Z is 01:30 EST (UTC-5) — still March 7? No: 06:30-5h = 01:30 Mar 8.
    expect(coupleLocalDateKey(new Date('2026-03-08T06:30:00Z'), 'America/New_York')).toBe('2026-03-08');
    // 03:30Z on Mar 8 = 22:30 Mar 7 EST (pre-spring-forward).
    expect(coupleLocalDateKey(new Date('2026-03-08T03:30:00Z'), 'America/New_York')).toBe('2026-03-07');
  });

  it('defaults a null tz to Asia/Singapore', () => {
    expect(coupleLocalDateKey(lateUtc, null)).toBe('2026-07-08');
  });

  it('falls back to the device-local date on an invalid tz', () => {
    const d = new Date(2026, 6, 7, 12, 0, 0); // device-local noon Jul 7
    expect(coupleLocalDateKey(d, 'Not/AZone')).toBe('2026-07-07');
  });
});

describe('moodCardState', () => {
  const base = {
    flagOn: true,
    isLive: true,
    playedToday: false,
    mood: null,
    pickedThisSession: false,
    offerDismissedToday: false,
  } as const;

  it('is hidden when the flag is off', () => {
    expect(moodCardState({ ...base, flagOn: false })).toEqual({ kind: 'hidden' });
  });

  it('is hidden in demo mode (not live)', () => {
    expect(moodCardState({ ...base, isLive: false })).toEqual({ kind: 'hidden' });
  });

  it('greets when nothing has happened today', () => {
    expect(moodCardState({ ...base })).toEqual({ kind: 'greeting' });
  });

  it('never greets on a day the couple already played', () => {
    expect(moodCardState({ ...base, playedToday: true })).toEqual({ kind: 'hidden' });
  });

  it('shows the transient ack right after a bright pick', () => {
    expect(
      moodCardState({ ...base, mood: 'good', pickedThisSession: true })
    ).toEqual({ kind: 'ack' });
  });

  it('hides a bright mood on the next open (row exists, not this session)', () => {
    expect(moodCardState({ ...base, mood: 'golden' })).toEqual({ kind: 'hidden' });
  });

  it('offers refocus after a rough pick, including across remounts', () => {
    expect(
      moodCardState({ ...base, mood: 'heavy', pickedThisSession: true })
    ).toEqual({ kind: 'offer' });
    expect(moodCardState({ ...base, mood: 'off' })).toEqual({ kind: 'offer' });
  });

  it('never re-shows the offer after dismissal that day', () => {
    expect(
      moodCardState({ ...base, mood: 'heavy', offerDismissedToday: true })
    ).toEqual({ kind: 'hidden' });
  });

  it('hides the offer once the couple has played (never blocks the drop)', () => {
    expect(
      moodCardState({ ...base, mood: 'heavy', playedToday: true })
    ).toEqual({ kind: 'hidden' });
  });
});
