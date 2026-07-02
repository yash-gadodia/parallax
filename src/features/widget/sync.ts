import { Platform } from 'react-native';
import type { WidgetSnapshot } from './snapshot';

/** Must match app.json ios.entitlements + targets/widget (index.swift `appGroup`). */
export const APP_GROUP = 'group.com.yashgadodia.parallax';
/** Must match targets/widget/index.swift `snapshotKey`. */
export const SNAPSHOT_KEY = 'widget_snapshot';

/**
 * Writes the snapshot JSON to the shared App Group UserDefaults and asks
 * WidgetKit to reload timelines, via @bacons/apple-targets' ExtensionStorage.
 *
 * Safe everywhere: no-ops (returns false) on Android/web, in jest, and in any
 * binary without the native module (Expo Go, pre-widget builds) — the require
 * is lazy and failures are swallowed so the app flow is never affected.
 */
export function syncWidgetState(snapshot: WidgetSnapshot): boolean {
  if (Platform.OS !== 'ios') return false;
  try {
    const { ExtensionStorage } =
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('@bacons/apple-targets') as typeof import('@bacons/apple-targets');
    const storage = new ExtensionStorage(APP_GROUP);
    storage.set(SNAPSHOT_KEY, JSON.stringify(snapshot));
    ExtensionStorage.reloadWidget();
    return true;
  } catch {
    return false;
  }
}
