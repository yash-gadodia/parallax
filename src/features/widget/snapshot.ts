import type { Couple, TodayState } from '../../types/db';

/**
 * The four widget states rendered natively in targets/widget/index.swift:
 *  - 'guess'   (a) partner answered, you haven't — urgent
 *  - 'synced'  (b) both done — wavelength + streak, celebratory
 *  - 'waiting' (c) drop open, nothing to reveal yet — teaser
 *  - 'none'    (d) no data — wordmark fallback
 */
export type WidgetState = 'guess' | 'synced' | 'waiting' | 'none';

export interface WidgetSnapshot {
  state: WidgetState;
  partnerName: string;
  wavePct: number;
  streak: number;
  /** Couple-local yyyy-mm-dd this snapshot describes; the widget degrades stale days to 'waiting'. */
  date: string;
}

/**
 * Pure mapping from the app's server-truth TodayState to the widget snapshot.
 * "I answered, partner hasn't" intentionally maps to 'waiting' — the urgent
 * 'guess' state is reserved for when the ball is in MY court.
 */
export function computeWidgetSnapshot(
  today: TodayState | null,
  couple: Couple | null,
  partnerName: string
): WidgetSnapshot {
  const streak = couple?.streak ?? 0;
  if (!today || !today.exists) {
    return { state: 'none', partnerName, wavePct: 0, streak, date: today?.date ?? '' };
  }
  if (today.state === 'revealed') {
    return {
      state: 'synced',
      partnerName,
      wavePct: Math.round(today.wave_pct ?? 0),
      streak,
      date: today.date,
    };
  }
  if (today.partner_answered && !today.i_answered) {
    return { state: 'guess', partnerName, wavePct: 0, streak, date: today.date };
  }
  return { state: 'waiting', partnerName, wavePct: 0, streak, date: today.date };
}
