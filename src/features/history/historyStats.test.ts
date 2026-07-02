import { waveDot, weeklyDots, monthStats, monthLabel, dayLabel, pickOnThisDay } from './historyStats';
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
});
