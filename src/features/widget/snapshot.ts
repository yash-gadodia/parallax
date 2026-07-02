import type { Couple, TodayState } from '../../types/db';

/**
 * The five widget states rendered natively in targets/widget/index.swift:
 *  - 'guess'   (a) partner answered, you haven't — urgent
 *  - 'synced'  (b) both done — wavelength + streak, celebratory
 *  - 'waiting' (c) drop open, nothing to reveal yet — teaser
 *  - 'none'    (d) no data — wordmark fallback
 *  - 'risk'    (e) 20:00+ device-local, streak alive, today not revealed —
 *               the streak dies at midnight either way, so this outranks 'guess'
 */
export type WidgetState = 'guess' | 'synced' | 'waiting' | 'none' | 'risk';

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
 * 'guess' state is reserved for when the ball is in MY court. The clock is
 * injected (never Date.now here) so the 20:00 streak-risk boundary is
 * exact-testable.
 */
export function computeWidgetSnapshot(
  today: TodayState | null,
  couple: Couple | null,
  partnerName: string,
  now: Date
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
  if (now.getHours() >= 20 && streak > 0) {
    return { state: 'risk', partnerName, wavePct: 0, streak, date: today.date };
  }
  if (today.partner_answered && !today.i_answered) {
    return { state: 'guess', partnerName, wavePct: 0, streak, date: today.date };
  }
  return { state: 'waiting', partnerName, wavePct: 0, streak, date: today.date };
}
