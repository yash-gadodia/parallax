import type { CoupleHistoryRow } from '../../types/db';

// Pure helpers over couple_history rows (server-computed, most recent first).
// RN-free so they unit-test with exact values.

// Spoiler-free wavelength dot: 🟢 strong day, 🟡 mixed day, 🔴 rough day.
export function waveDot(pct: number): string {
  if (pct >= 70) return '🟢';
  if (pct >= 40) return '🟡';
  return '🔴';
}

// Up to the last 7 revealed days as dots, in couple_history order
// (most recent first). Never includes questions or answers.
export function weeklyDots(history: Array<Pick<CoupleHistoryRow, 'wavelength'>>): string {
  return history
    .slice(0, 7)
    .map((h) => waveDot(h.wavelength))
    .join('');
}

export interface MonthStats {
  // Revealed drops in the month of `now`.
  count: number;
  // Rounded mean wave of those drops; null when there are none.
  avgWave: number | null;
  // Highest-wavelength day (most recent wins a tie); null when none.
  best: CoupleHistoryRow | null;
}

function isoMonth(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function monthStats(history: CoupleHistoryRow[], now: Date): MonthStats {
  const month = isoMonth(now);
  const rows = history.filter((h) => h.date.slice(0, 7) === month);

  if (rows.length === 0) {
    return { count: 0, avgWave: null, best: null };
  }

  const avgWave = Math.round(
    rows.reduce((acc, r) => acc + r.wavelength, 0) / rows.length
  );

  let best = rows[0];
  for (const r of rows) {
    if (r.wavelength > best.wavelength) best = r;
  }

  return { count: rows.length, avgWave, best };
}

export interface MonthAvg {
  // 1-12.
  month: number;
  avg: number;
  count: number;
}

export interface YearStats {
  year: number;
  // Revealed drops in `year`.
  count: number;
  // Rounded mean wave of those drops; null when there are none.
  avgWave: number | null;
  // The hit-rate curve: per-month average wavelength, january -> december,
  // only for months with at least one reveal.
  curve: MonthAvg[];
  // Most telepathic month (highest avg; the later month wins a tie).
  bestMonth: MonthAvg | null;
  twinsTotal: number;
}

export function yearStats(history: CoupleHistoryRow[], year: number): YearStats {
  const rows = history.filter((h) => h.date.slice(0, 4) === String(year));

  if (rows.length === 0) {
    return { year, count: 0, avgWave: null, curve: [], bestMonth: null, twinsTotal: 0 };
  }

  const avgWave = Math.round(
    rows.reduce((acc, r) => acc + r.wavelength, 0) / rows.length
  );
  const twinsTotal = rows.reduce((acc, r) => acc + r.twins_count, 0);

  const curve: MonthAvg[] = [];
  for (let m = 1; m <= 12; m++) {
    const inMonth = rows.filter((r) => Number(r.date.slice(5, 7)) === m);
    if (inMonth.length === 0) continue;
    curve.push({
      month: m,
      avg: Math.round(inMonth.reduce((acc, r) => acc + r.wavelength, 0) / inMonth.length),
      count: inMonth.length,
    });
  }

  let bestMonth = curve[0];
  for (const m of curve) {
    if (m.avg >= bestMonth.avg) bestMonth = m;
  }

  return { year, count: rows.length, avgWave, curve, bestMonth, twinsTotal };
}

// A year needs this many revealed drops before an annual recap (and its
// archetype) means anything — mirrors the monthly MIN_DROPS gate.
export const MIN_DROPS_FOR_YEAR_WRAPPED = 10;

export interface Archetype {
  name: string;
  line: string;
}

// The couple's archetype, derived only from their real year: twins ratio,
// then wavelength trend, then monthly consistency. Every branch celebrates
// the pattern — none of them grade the relationship. Never canned.
export function archetypeFor(stats: YearStats): Archetype | null {
  if (stats.count < MIN_DROPS_FOR_YEAR_WRAPPED || stats.curve.length === 0) return null;

  const avgs = stats.curve.map((m) => m.avg);
  const trend = avgs[avgs.length - 1] - avgs[0];
  const spread = Math.max(...avgs) - Math.min(...avgs);

  if (stats.twinsTotal / stats.count >= 1) {
    return {
      name: 'the mind readers',
      line: `${stats.twinsTotal} twin answers across ${stats.count} drops — you two keep landing on the same thought.`,
    };
  }
  if (trend >= 5) {
    return {
      name: 'the crescendo',
      line: `from ${avgs[0]}% to ${avgs[avgs.length - 1]}% — your wavelength climbed through the year.`,
    };
  }
  if (spread <= 6) {
    return {
      name: 'the steady flame',
      line: `your monthly averages stayed within ${spread} points all year — steady, on purpose.`,
    };
  }
  return {
    name: 'the wave riders',
    line: `${spread} points between your calmest and wildest months — you rode every wave together.`,
  };
}

// The "on this day" memory: the most interesting past reveal. Highest
// wavelength wins; couple_history arrives most-recent-first, so a tie keeps
// the earliest index — i.e. the most recent of the tied days.
export function pickOnThisDay(history: CoupleHistoryRow[]): CoupleHistoryRow | null {
  if (history.length === 0) return null;
  let best = history[0];
  for (const row of history) {
    if (row.wavelength > best.wavelength) best = row;
  }
  return best;
}

// 'july' — the app's lowercase voice.
export function monthLabel(now: Date): string {
  return now.toLocaleString('en-US', { month: 'long' }).toLowerCase();
}

const MONTHS_SHORT = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
];

// 7 -> 'jul' (1-12).
export function monthShort(month: number): string {
  return MONTHS_SHORT[month - 1];
}

// 7 -> 'july' (1-12).
export function monthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString('en-US', { month: 'long' }).toLowerCase();
}

// '2026-07-04' -> 'july 4'. Parses the date parts directly (no TZ drift).
export function dayLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const name = new Date(y, m - 1, d).toLocaleString('en-US', { month: 'long' }).toLowerCase();
  return `${name} ${d}`;
}
