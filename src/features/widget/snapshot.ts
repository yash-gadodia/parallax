import type { Couple, TodayState } from '../../types/db';
import { localDayKey } from '../drops/useTodayState';

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

/**
 * Re-derives what a snapshot means when READ at `now`, mirroring the Swift
 * widget's readMood (targets/widget/index.swift): a snapshot from a previous
 * day degrades to 'waiting' (a fresh drop is out), and the 20:00 streak-risk
 * flip is applied at read time — the app may have written the snapshot hours
 * before the evening. Shared by the Live Activity state machine so the risk
 * rule lives in exactly one place per language.
 */
export function effectiveWidgetState(snapshot: WidgetSnapshot, now: Date): WidgetState {
  if (snapshot.state === 'none') return 'none';
  if (snapshot.date !== localDayKey(now)) return 'waiting';
  const isRiskHour = now.getHours() >= 20;
  if (snapshot.state === 'guess' || snapshot.state === 'waiting') {
    return isRiskHour && snapshot.streak > 0 ? 'risk' : snapshot.state;
  }
  return snapshot.state;
}
