import { computeLiveActivityDirective, coupleMidnightMs, MIN_RUNWAY_MS } from './directive';
import { effectiveWidgetState } from '../widget/snapshot';
import type { WidgetSnapshot } from '../widget/snapshot';

const snap = (over: Partial<WidgetSnapshot> = {}): WidgetSnapshot => ({
  state: 'risk',
  partnerName: 'Dani',
  wavePct: 0,
  streak: 14,
  date: '2026-07-02',
  ...over,
});

// Injected clocks on 2026-07-02, around the 20:00 boundary (device-local).
const MORNING = new Date(2026, 6, 2, 10, 0, 0);
const ONE_TO_EIGHT = new Date(2026, 6, 2, 19, 59, 59);
const EIGHT_SHARP = new Date(2026, 6, 2, 20, 0, 0);
const TWENTY_TO_MIDNIGHT = new Date(2026, 6, 2, 20, 48, 0);
const MIDNIGHT_JULY_3 = new Date(2026, 6, 3, 0, 0, 0).getTime();

describe('coupleMidnightMs', () => {
  it('is device-local midnight at the END of the given day', () => {
    expect(coupleMidnightMs('2026-07-02')).toBe(MIDNIGHT_JULY_3);
  });

  it('normalises month and year rollovers', () => {
    expect(coupleMidnightMs('2026-07-31')).toBe(new Date(2026, 7, 1, 0, 0, 0).getTime());
    expect(coupleMidnightMs('2026-12-31')).toBe(new Date(2027, 0, 1, 0, 0, 0).getTime());
  });

  it('rejects a malformed day key', () => {
    expect(coupleMidnightMs('')).toBeNull();
    expect(coupleMidnightMs('yesterday')).toBeNull();
    expect(coupleMidnightMs('2026-7-2')).toBeNull();
  });
});

describe('effectiveWidgetState (read-time degradation, mirrors Swift readMood)', () => {
  it('degrades a snapshot from a previous day to waiting', () => {
    expect(effectiveWidgetState(snap({ date: '2026-07-01' }), MORNING)).toBe('waiting');
  });

  it('flips waiting -> risk at 20:00 with a streak alive', () => {
    expect(effectiveWidgetState(snap({ state: 'waiting' }), EIGHT_SHARP)).toBe('risk');
    expect(effectiveWidgetState(snap({ state: 'waiting' }), ONE_TO_EIGHT)).toBe('waiting');
  });

  it('flips guess -> risk at 20:00, but never without a streak', () => {
    expect(effectiveWidgetState(snap({ state: 'guess' }), EIGHT_SHARP)).toBe('risk');
    expect(effectiveWidgetState(snap({ state: 'guess', streak: 0 }), EIGHT_SHARP)).toBe('guess');
  });

  it('leaves synced and none untouched', () => {
    expect(effectiveWidgetState(snap({ state: 'synced', wavePct: 83 }), EIGHT_SHARP)).toBe('synced');
    expect(effectiveWidgetState(snap({ state: 'none' }), EIGHT_SHARP)).toBe('none');
  });
});

describe('computeLiveActivityDirective', () => {
  it('starts a countdown to couple-midnight for tonight\'s risk snapshot', () => {
    expect(computeLiveActivityDirective(snap(), TWENTY_TO_MIDNIGHT)).toEqual({
      action: 'start',
      streak: 14,
      endAtMs: MIDNIGHT_JULY_3,
      dayKey: '2026-07-02',
    });
    // 20:48 -> midnight is exactly 3h 12m of runway.
    expect(MIDNIGHT_JULY_3 - TWENTY_TO_MIDNIGHT.getTime()).toBe((3 * 60 + 12) * 60 * 1000);
  });

  it('re-derives risk at read time: a stale waiting snapshot starts after 20:00', () => {
    expect(computeLiveActivityDirective(snap({ state: 'waiting' }), EIGHT_SHARP)).toEqual({
      action: 'start',
      streak: 14,
      endAtMs: MIDNIGHT_JULY_3,
      dayKey: '2026-07-02',
    });
  });

  it('ends before 20:00 — the boundary is exact', () => {
    expect(computeLiveActivityDirective(snap({ state: 'waiting' }), ONE_TO_EIGHT)).toEqual({
      action: 'end',
    });
  });

  it('ends when the drop is revealed (synced outranks risk)', () => {
    expect(
      computeLiveActivityDirective(snap({ state: 'synced', wavePct: 83 }), TWENTY_TO_MIDNIGHT)
    ).toEqual({ action: 'end' });
  });

  it('never runs without a streak to lose', () => {
    expect(computeLiveActivityDirective(snap({ streak: 0 }), TWENTY_TO_MIDNIGHT)).toEqual({
      action: 'end',
    });
  });

  it('ends for a none snapshot and for no snapshot at all', () => {
    expect(computeLiveActivityDirective(snap({ state: 'none' }), TWENTY_TO_MIDNIGHT)).toEqual({
      action: 'end',
    });
    expect(computeLiveActivityDirective(null, TWENTY_TO_MIDNIGHT)).toEqual({ action: 'end' });
  });

  it('ends when the snapshot is from a previous day (stale risk never revives)', () => {
    expect(
      computeLiveActivityDirective(snap({ date: '2026-07-01' }), TWENTY_TO_MIDNIGHT)
    ).toEqual({ action: 'end' });
  });

  it('skips a countdown with less than a minute of runway', () => {
    const almostMidnight = new Date(MIDNIGHT_JULY_3 - MIN_RUNWAY_MS + 1);
    expect(computeLiveActivityDirective(snap(), almostMidnight)).toEqual({ action: 'end' });
    const exactlyOneMinute = new Date(MIDNIGHT_JULY_3 - MIN_RUNWAY_MS);
    expect(computeLiveActivityDirective(snap(), exactlyOneMinute)).toEqual({
      action: 'start',
      streak: 14,
      endAtMs: MIDNIGHT_JULY_3,
      dayKey: '2026-07-02',
    });
  });
});
