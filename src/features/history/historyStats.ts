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

// '2026-07-04' -> 'july 4'. Parses the date parts directly (no TZ drift).
export function dayLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const name = new Date(y, m - 1, d).toLocaleString('en-US', { month: 'long' }).toLowerCase();
  return `${name} ${d}`;
}
