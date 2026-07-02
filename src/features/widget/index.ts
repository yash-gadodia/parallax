import type { Couple, TodayState } from '../../types/db';
import { computeWidgetSnapshot } from './snapshot';
import { syncWidgetState } from './sync';

export { computeWidgetSnapshot } from './snapshot';
export type { WidgetSnapshot, WidgetState } from './snapshot';
export { syncWidgetState, APP_GROUP, SNAPSHOT_KEY } from './sync';

/**
 * One-call bridge for app code: map server-truth today state -> widget snapshot
 * and push it to the home-screen widget. Call wherever TodayState is (re)fetched
 * (useTodayState.refresh) and on app foreground.
 */
export function syncWidgetFromToday(
  today: TodayState | null,
  couple: Couple | null,
  partnerName: string
): boolean {
  return syncWidgetState(computeWidgetSnapshot(today, couple, partnerName));
}
