// V2 F5 growth story (V2_PLAN §4-F5 + §10) — pure, RN-free.

export interface GrowthStats {
  learnings: number;
  roughMoments: number;
  repairs: number;
}

// The Wrapped growth card is conditional, never a scoreboard: couples with
// repairs+learnings see the flywheel line; everyone else sees an
// always-positive default. It never disappears and never shows a zero —
// a low-conflict couple must not read "0 repairs" as a verdict.
export type GrowthSlideVariant =
  | { kind: 'flywheel'; rough: number; learned: number; repairs: number }
  | { kind: 'learned'; learned: number }
  | { kind: 'start' };

export function growthSlideVariant(s: GrowthStats): GrowthSlideVariant {
  if (s.repairs > 0 && s.learnings > 0) {
    return {
      kind: 'flywheel',
      rough: Math.max(s.roughMoments, s.repairs),
      learned: s.learnings,
      repairs: s.repairs,
    };
  }
  if (s.learnings > 0) return { kind: 'learned', learned: s.learnings };
  return { kind: 'start' };
}

/** "23 things you now know about each other" — singular-safe. */
export function counterUnit(count: number): string {
  return count === 1
    ? 'thing you now know about each other'
    : 'things you now know about each other';
}

/** Is the ISO timestamp inside the recap period anchored at `now`? */
export function inPeriod(iso: string | null | undefined, now: Date, range: 'month' | 'year'): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  if (d.getFullYear() !== now.getFullYear()) return false;
  return range === 'year' || d.getMonth() === now.getMonth();
}
