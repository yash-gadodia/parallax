import type { Couple, TodayState } from '../../types/db';
import { syncLiveActivityFromSnapshot } from '../liveActivity';
import { computeWidgetSnapshot } from './snapshot';
import { syncWidgetState } from './sync';

export { computeWidgetSnapshot, effectiveWidgetState } from './snapshot';
export type { WidgetSnapshot, WidgetState } from './snapshot';
export { syncWidgetState, APP_GROUP, SNAPSHOT_KEY } from './sync';

/**
 * One-call bridge for app code: map server-truth today state -> widget snapshot
 * and push it to the home-screen widget. Call wherever TodayState is (re)fetched
 * (useTodayState.refresh) and on app foreground. The same snapshot also drives
 * the streak-countdown Live Activity (src/features/liveActivity) — one funnel,
 * so the lock screen and the home screen can never disagree.
 */
export function syncWidgetFromToday(
  today: TodayState | null,
  couple: Couple | null,
  partnerName: string,
  now: Date = new Date()
): boolean {
  const snapshot = computeWidgetSnapshot(today, couple, partnerName, now);
  const synced = syncWidgetState(snapshot);
  syncLiveActivityFromSnapshot(snapshot, now);
  return synced;
}
