import { counterUnit, growthSlideVariant, inPeriod } from './growthLogic';

describe('growthSlideVariant', () => {
  it('shows the flywheel only with repairs AND learnings', () => {
    expect(growthSlideVariant({ learnings: 5, roughMoments: 2, repairs: 2 })).toEqual({
      kind: 'flywheel',
      rough: 2,
      learned: 5,
      repairs: 2,
    });
  });

  it('never reports fewer rough moments than repairs', () => {
    // a repair implies a rough moment even if the session list is partial
    expect(growthSlideVariant({ learnings: 3, roughMoments: 0, repairs: 1 })).toEqual({
      kind: 'flywheel',
      rough: 1,
      learned: 3,
      repairs: 1,
    });
  });

  it('falls back to the always-positive learned count without repairs', () => {
    expect(growthSlideVariant({ learnings: 5, roughMoments: 1, repairs: 0 })).toEqual({
      kind: 'learned',
      learned: 5,
    });
  });

  it('repairs without learnings never shows a zero — learned default wins', () => {
    expect(growthSlideVariant({ learnings: 0, roughMoments: 2, repairs: 1 })).toEqual({
      kind: 'start',
    });
  });

  it('no data at all renders the warm start, never zeros', () => {
    expect(growthSlideVariant({ learnings: 0, roughMoments: 0, repairs: 0 })).toEqual({
      kind: 'start',
    });
  });
});

describe('counterUnit', () => {
  it('is singular-safe', () => {
    expect(counterUnit(1)).toBe('thing you now know about each other');
    expect(counterUnit(23)).toBe('things you now know about each other');
    expect(counterUnit(0)).toBe('things you now know about each other');
  });
});

describe('inPeriod', () => {
  const now = new Date(2026, 6, 7); // July 2026

  it('month range matches only the same month + year', () => {
    expect(inPeriod('2026-07-01T10:00:00Z', now, 'month')).toBe(true);
    expect(inPeriod('2026-06-30T10:00:00Z', now, 'month')).toBe(false);
    expect(inPeriod('2025-07-07T10:00:00Z', now, 'month')).toBe(false);
  });

  it('year range matches the whole year', () => {
    expect(inPeriod('2026-01-01T10:00:00Z', now, 'year')).toBe(true);
    expect(inPeriod('2025-12-31T10:00:00Z', now, 'year')).toBe(false);
  });

  it('null/invalid timestamps never match', () => {
    expect(inPeriod(null, now, 'year')).toBe(false);
    expect(inPeriod('garbage', now, 'year')).toBe(false);
  });
});
