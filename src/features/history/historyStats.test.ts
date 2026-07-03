import {
  waveDot,
  weeklyDots,
  monthStats,
  monthLabel,
  monthName,
  monthShort,
  dayLabel,
  pickOnThisDay,
  yearStats,
  archetypeFor,
  MIN_DROPS_FOR_YEAR_WRAPPED,
} from './historyStats';
import type { CoupleHistoryRow } from '../../types/db';

const row = (date: string, wavelength: number, title = 'a drop'): CoupleHistoryRow => ({
  couple_drop_id: 'cd-1',
  date,
  code: 'W1',
  title,
  wavelength,
  twins_count: 0,
  caught_up: false,
});

// n rows in a month, all at the same wavelength/twins — the archetype fixtures.
const monthRows = (
  yearMonth: string,
  n: number,
  wavelength: number,
  twins = 0
): CoupleHistoryRow[] =>
  Array.from({ length: n }, (_, i) => ({
    ...row(`${yearMonth}-${String(i + 1).padStart(2, '0')}`, wavelength),
    twins_count: twins,
  }));

describe('waveDot', () => {
  it('maps >= 70 to 🟢', () => {
    expect(waveDot(70)).toBe('🟢');
    expect(waveDot(100)).toBe('🟢');
  });

  it('maps 40-69 to 🟡', () => {
    expect(waveDot(40)).toBe('🟡');
    expect(waveDot(69)).toBe('🟡');
  });

  it('maps < 40 to 🔴', () => {
    expect(waveDot(39)).toBe('🔴');
    expect(waveDot(0)).toBe('🔴');
  });
});

describe('weeklyDots', () => {
  it('renders the seeded history [80, 75, 55] as 🟢🟢🟡', () => {
    expect(
      weeklyDots([{ wavelength: 80 }, { wavelength: 75 }, { wavelength: 55 }])
    ).toBe('🟢🟢🟡');
  });

  it('caps the pattern at the last 7 days', () => {
    const nine = Array.from({ length: 9 }, () => ({ wavelength: 90 }));
    expect(weeklyDots(nine)).toBe('🟢🟢🟢🟢🟢🟢🟢');
  });

  it('is empty for no history', () => {
    expect(weeklyDots([])).toBe('');
  });
});

describe('monthStats', () => {
  const now = new Date(2026, 6, 15); // July 15, 2026

  it('counts only the reveals in the month of `now`', () => {
    const stats = monthStats(
      [row('2026-07-10', 80), row('2026-07-02', 60), row('2026-06-30', 90)],
      now
    );
    expect(stats.count).toBe(2);
  });

  it('averages the month wavelengths exactly (80 + 60 + 70 -> 70)', () => {
    const stats = monthStats(
      [row('2026-07-10', 80), row('2026-07-08', 60), row('2026-07-02', 70)],
      now
    );
    expect(stats.avgWave).toBe(70);
  });

  it('rounds the average (80 + 75 + 55 -> 70)', () => {
    const stats = monthStats(
      [row('2026-07-10', 80), row('2026-07-08', 75), row('2026-07-02', 55)],
      now
    );
    expect(stats.avgWave).toBe(70);
  });

  it('picks the highest-wavelength day as best, most recent winning a tie', () => {
    const best = monthStats(
      [
        row('2026-07-12', 91, 'the tie winner'),
        row('2026-07-08', 76),
        row('2026-07-03', 91, 'the older tie'),
      ],
      now
    ).best;
    expect(best?.title).toBe('the tie winner');
    expect(best?.wavelength).toBe(91);
    expect(best?.date).toBe('2026-07-12');
  });

  it('returns the honest empty shape when the month has no reveals', () => {
    expect(monthStats([row('2026-06-30', 90)], now)).toEqual({
      count: 0,
      avgWave: null,
      best: null,
    });
  });
});

describe('yearStats', () => {
  it('counts only the reveals from the given year', () => {
    const s = yearStats(
      [row('2026-03-10', 80), row('2025-12-31', 90), row('2026-07-02', 60)],
      2026
    );
    expect(s.year).toBe(2026);
    expect(s.count).toBe(2);
  });

  it('averages the year exactly (80 + 60 + 70 -> 70)', () => {
    const s = yearStats(
      [row('2026-07-10', 80), row('2026-05-08', 60), row('2026-01-02', 70)],
      2026
    );
    expect(s.avgWave).toBe(70);
  });

  it('rounds the year average (95 + 90 -> 93)', () => {
    const s = yearStats([row('2026-07-10', 95), row('2026-05-08', 90)], 2026);
    expect(s.avgWave).toBe(93);
  });

  it('builds the hit-rate curve january -> december with exact per-month averages', () => {
    const s = yearStats(
      [
        row('2026-07-20', 90),
        row('2026-01-10', 80),
        row('2026-01-20', 71),
        row('2026-03-05', 60),
      ],
      2026
    );
    expect(s.curve).toEqual([
      { month: 1, avg: 76, count: 2 },
      { month: 3, avg: 60, count: 1 },
      { month: 7, avg: 90, count: 1 },
    ]);
  });

  it('picks the highest-average month as most telepathic', () => {
    const s = yearStats(
      [
        row('2026-01-10', 70),
        row('2026-04-10', 85),
        row('2026-09-10', 80),
      ],
      2026
    );
    expect(s.bestMonth).toEqual({ month: 4, avg: 85, count: 1 });
  });

  it('breaks a most-telepathic tie toward the later month', () => {
    const s = yearStats([row('2026-01-10', 88), row('2026-06-10', 88)], 2026);
    expect(s.bestMonth).toEqual({ month: 6, avg: 88, count: 1 });
  });

  it('sums twin answers across the year', () => {
    const twins = (date: string, wavelength: number, t: number) => ({
      ...row(date, wavelength),
      twins_count: t,
    });
    const s = yearStats(
      [twins('2026-02-01', 80, 2), twins('2026-02-02', 80, 1), twins('2026-05-01', 80, 0)],
      2026
    );
    expect(s.twinsTotal).toBe(3);
  });

  it('returns the honest empty shape for a year with no reveals', () => {
    expect(yearStats([row('2025-06-01', 90)], 2026)).toEqual({
      year: 2026,
      count: 0,
      avgWave: null,
      curve: [],
      bestMonth: null,
      twinsTotal: 0,
    });
  });
});

describe('archetypeFor', () => {
  it('is null under the minimum — the honest not-yet case', () => {
    expect(MIN_DROPS_FOR_YEAR_WRAPPED).toBe(10);
    expect(archetypeFor(yearStats(monthRows('2026-01', 9, 80, 3), 2026))).toBeNull();
    expect(archetypeFor(yearStats([], 2026))).toBeNull();
  });

  it('names the mind readers when twins average at least one per drop', () => {
    const s = yearStats(monthRows('2026-01', 10, 80, 1), 2026);
    expect(archetypeFor(s)).toEqual({
      name: 'the mind readers',
      line: '10 twin answers across 10 drops — you two keep landing on the same thought.',
    });
  });

  it('mind readers wins over a climbing trend (twins checked first)', () => {
    const s = yearStats(
      [...monthRows('2026-01', 5, 70, 1), ...monthRows('2026-06', 5, 80, 1)],
      2026
    );
    expect(archetypeFor(s)?.name).toBe('the mind readers');
  });

  it('names the crescendo when the last played month is 5+ points over the first', () => {
    const s = yearStats(
      [...monthRows('2026-01', 5, 70), ...monthRows('2026-06', 5, 80)],
      2026
    );
    expect(archetypeFor(s)).toEqual({
      name: 'the crescendo',
      line: 'from 70% to 80% — your wavelength climbed through the year.',
    });
  });

  it('names the steady flame when monthly averages stay within 6 points', () => {
    const s = yearStats(
      [...monthRows('2026-01', 5, 78), ...monthRows('2026-06', 5, 80)],
      2026
    );
    expect(archetypeFor(s)).toEqual({
      name: 'the steady flame',
      line: 'your monthly averages stayed within 2 points all year — steady, on purpose.',
    });
  });

  it('names the wave riders when the months swing wide without climbing', () => {
    const s = yearStats(
      [...monthRows('2026-01', 5, 80), ...monthRows('2026-06', 5, 60)],
      2026
    );
    expect(archetypeFor(s)).toEqual({
      name: 'the wave riders',
      line: '20 points between your calmest and wildest months — you rode every wave together.',
    });
  });
});

describe('pickOnThisDay', () => {
  it('picks the highest-wavelength reveal', () => {
    const memory = pickOnThisDay([
      row('2026-07-10', 72),
      row('2026-07-06', 94, 'the deep end'),
      row('2026-07-01', 81),
    ]);
    expect(memory?.title).toBe('the deep end');
    expect(memory?.wavelength).toBe(94);
    expect(memory?.date).toBe('2026-07-06');
  });

  it('breaks a wavelength tie toward the most recent day', () => {
    const memory = pickOnThisDay([
      row('2026-07-10', 88, 'newer'),
      row('2026-07-02', 88, 'older'),
    ]);
    expect(memory?.title).toBe('newer');
    expect(memory?.date).toBe('2026-07-10');
  });

  it('falls back to the most recent reveal when all waves are equal', () => {
    const memory = pickOnThisDay([row('2026-07-09', 50, 'latest'), row('2026-07-08', 50)]);
    expect(memory?.title).toBe('latest');
  });

  it('is null with no history', () => {
    expect(pickOnThisDay([])).toBeNull();
  });
});

describe('labels', () => {
  it('monthLabel is the lowercase month name', () => {
    expect(monthLabel(new Date(2026, 6, 15))).toBe('july');
    expect(monthLabel(new Date(2026, 0, 1))).toBe('january');
  });

  it('dayLabel formats an ISO date as "month day"', () => {
    expect(dayLabel('2026-07-04')).toBe('july 4');
    expect(dayLabel('2026-12-25')).toBe('december 25');
  });

  it('monthShort maps 1-12 to the lowercase short name', () => {
    expect(monthShort(1)).toBe('jan');
    expect(monthShort(7)).toBe('jul');
    expect(monthShort(12)).toBe('dec');
  });

  it('monthName maps 1-12 to the lowercase full name', () => {
    expect(monthName(1)).toBe('january');
    expect(monthName(7)).toBe('july');
  });
});
