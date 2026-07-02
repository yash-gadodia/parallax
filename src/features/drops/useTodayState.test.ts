import { coupleAgeDays, firstWeekBeat, isEvening, localDayKey } from './useTodayState';

// Local-time constructor so the helpers (device-local by design) are exact.
const local = (
  y: number,
  m: number,
  d: number,
  h = 12,
  min = 0
): Date => new Date(y, m - 1, d, h, min, 0);

describe('coupleAgeDays', () => {
  const now = local(2026, 7, 2, 10, 0);

  it('is 0 the day the couple is created', () => {
    expect(coupleAgeDays(local(2026, 7, 2, 8, 30).toISOString(), now)).toBe(0);
  });

  it('is 1 the next local day even across a near-midnight creation', () => {
    expect(coupleAgeDays(local(2026, 7, 1, 23, 55).toISOString(), local(2026, 7, 2, 0, 10))).toBe(1);
  });

  it('is exactly 7 one week after creation', () => {
    expect(coupleAgeDays(local(2026, 6, 25, 19, 0).toISOString(), now)).toBe(7);
  });

  it('reads null and invalid created_at as 0, never NaN', () => {
    expect(coupleAgeDays(null, now)).toBe(0);
    expect(coupleAgeDays(undefined, now)).toBe(0);
    expect(coupleAgeDays('not-a-date', now)).toBe(0);
  });
});

describe('isEvening', () => {
  it('is false at 18:59 and true from 19:00', () => {
    expect(isEvening(local(2026, 7, 2, 18, 59))).toBe(false);
    expect(isEvening(local(2026, 7, 2, 19, 0))).toBe(true);
    expect(isEvening(local(2026, 7, 2, 23, 30))).toBe(true);
    expect(isEvening(local(2026, 7, 2, 7, 0))).toBe(false);
  });
});

describe('localDayKey', () => {
  it('formats the device-local day with zero padding', () => {
    expect(localDayKey(local(2026, 7, 2, 20, 0))).toBe('2026-07-02');
    expect(localDayKey(local(2026, 11, 30, 1, 0))).toBe('2026-11-30');
  });
});

describe('firstWeekBeat', () => {
  it('gives no beat on day 0 or day 1 (the streak-rule line owns day 1)', () => {
    expect(firstWeekBeat(0, 0)).toBeNull();
    expect(firstWeekBeat(1, 1)).toBeNull();
  });

  it('pulses on days 2 through 6 when the streak is 2+', () => {
    expect(firstWeekBeat(2, 2)).toBe('pulse');
    expect(firstWeekBeat(4, 3)).toBe('pulse');
    expect(firstWeekBeat(6, 6)).toBe('pulse');
  });

  it('does not pulse in the window when the streak has lapsed below 2', () => {
    expect(firstWeekBeat(3, 1)).toBeNull();
    expect(firstWeekBeat(5, 0)).toBeNull();
  });

  it('celebrates the week exactly on day 7 with a streak of 7+', () => {
    expect(firstWeekBeat(7, 7)).toBe('week');
    expect(firstWeekBeat(7, 8)).toBe('week');
  });

  it('gives no beat on day 7 with a broken streak, or after the first week', () => {
    expect(firstWeekBeat(7, 3)).toBeNull();
    expect(firstWeekBeat(8, 8)).toBeNull();
    expect(firstWeekBeat(30, 30)).toBeNull();
  });
});
