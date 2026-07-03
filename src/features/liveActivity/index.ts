import { AppState, type NativeEventSubscription } from 'react-native';
import type { WidgetSnapshot } from '../widget/snapshot';
import {
  computeLiveActivityDirective,
  type LiveActivityDirective,
} from './directive';
import { endStreakActivity, startOrUpdateStreakActivity } from './bridge';

export { computeLiveActivityDirective, coupleMidnightMs, MIN_RUNWAY_MS } from './directive';
export type { LiveActivityDirective } from './directive';

// The last snapshot the app pushed (module-level so the AppState listener can
// re-evaluate it with a fresh clock), and the last directive actually applied
// (so identical re-syncs don't spam the native bridge).
let lastSnapshot: WidgetSnapshot | null = null;
let lastAppliedKey: string | null = null;

function directiveKey(d: LiveActivityDirective): string {
  return d.action === 'start' ? `start:${d.dayKey}:${d.streak}:${d.endAtMs}` : 'end';
}

function applyDirective(d: LiveActivityDirective): void {
  const key = directiveKey(d);
  if (key === lastAppliedKey) return;
  lastAppliedKey = key;
  // Fire-and-forget: the bridge swallows every failure (see bridge.ts), so the
  // lock screen can never break the app flow.
  if (d.action === 'start') {
    void startOrUpdateStreakActivity(d.streak, d.endAtMs, d.dayKey);
  } else {
    void endStreakActivity();
  }
}

/**
 * Drives the streak-countdown Live Activity from the same snapshot the
 * home-screen widget gets (called by syncWidgetFromToday, i.e. whenever
 * TodayState is (re)fetched — including the realtime partner-submit and the
 * post-reveal refetch, which flips the snapshot to 'synced' and ends the
 * activity). The first sync after launch always applies, so a stray activity
 * from last night is torn down even before any state changes.
 */
export function syncLiveActivityFromSnapshot(
  snapshot: WidgetSnapshot | null,
  now: Date = new Date()
): void {
  lastSnapshot = snapshot;
  applyDirective(computeLiveActivityDirective(snapshot, now));
}

/**
 * Re-evaluates the last snapshot with a fresh clock whenever the app comes to
 * the foreground — that's how a session opened before 20:00 starts the
 * countdown after crossing the boundary, and how a stale (yesterday) activity
 * gets ended on the first morning open. iOS only lets the foregrounded app
 * START an activity, so foreground is exactly the moment to act (push-to-start
 * via APNs is a follow-up needing an entitlement change).
 */
export function attachLiveActivityLifecycle(): NativeEventSubscription {
  return AppState.addEventListener('change', (status) => {
    if (status !== 'active') return;
    applyDirective(computeLiveActivityDirective(lastSnapshot, new Date()));
  });
}

/** Test hook: clears the module-level memo between jest cases. */
export function __resetLiveActivityForTests(): void {
  lastSnapshot = null;
  lastAppliedKey = null;
}
