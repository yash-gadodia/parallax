import type { WidgetSnapshot } from '../widget/snapshot';
import { effectiveWidgetState } from '../widget/snapshot';

/**
 * What the Live Activity should be doing right now, derived purely from the
 * latest widget snapshot + an injected clock (never Date.now here — the 20:00
 * boundary and couple-midnight math are exact-testable).
 *
 *  - 'start': tonight's streak is at risk — run the countdown to couple-midnight.
 *    Idempotent downstream: the native side updates in place per dayKey.
 *  - 'end':   no risk (revealed / no streak / new day / not evening) — tear down.
 */
export type LiveActivityDirective =
  | { action: 'start'; streak: number; endAtMs: number; dayKey: string }
  | { action: 'end' };

/** Under a minute of runway isn't a countdown, it's a jump scare — skip it. */
export const MIN_RUNWAY_MS = 60 * 1000;

/**
 * Device-local midnight at the END of the given couple-day (yyyy-mm-dd) — when
 * the streak dies. Date's day-overflow normalisation handles month/year ends.
 * The app treats device-local time as couple-local (same convention as
 * computeWidgetSnapshot and the Swift widget).
 */
export function coupleMidnightMs(dayKey: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + 1, 0, 0, 0, 0).getTime();
}

export function computeLiveActivityDirective(
  snapshot: WidgetSnapshot | null,
  now: Date
): LiveActivityDirective {
  if (!snapshot) return { action: 'end' };
  // Never a countdown without a streak to lose (mirrors the widget's rule).
  if (snapshot.streak <= 0) return { action: 'end' };
  if (effectiveWidgetState(snapshot, now) !== 'risk') return { action: 'end' };
  const endAtMs = coupleMidnightMs(snapshot.date);
  if (endAtMs === null || endAtMs - now.getTime() < MIN_RUNWAY_MS) return { action: 'end' };
  return { action: 'start', streak: snapshot.streak, endAtMs, dayKey: snapshot.date };
}
