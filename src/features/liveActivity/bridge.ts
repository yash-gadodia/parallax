import { Platform } from 'react-native';

/** JS face of modules/parallax-live-activity (ParallaxLiveActivityModule.swift). */
interface LiveActivityNativeModule {
  isSupported(): boolean;
  startOrUpdate(streak: number, endTimestampMs: number, dayKey: string): Promise<boolean>;
  endAll(): Promise<boolean>;
}

/**
 * Lazy native access, mirroring src/features/widget/sync.ts: no-ops (null) on
 * Android/web, in jest, and in any binary without the module (Expo Go,
 * pre-Live-Activity builds) — failures are swallowed so the app flow is never
 * affected by the lock screen being unavailable.
 */
function nativeModule(): LiveActivityNativeModule | null {
  if (Platform.OS !== 'ios') return null;
  try {
    const { requireNativeModule } =
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('expo-modules-core') as typeof import('expo-modules-core');
    return requireNativeModule<LiveActivityNativeModule>('ParallaxLiveActivity');
  } catch {
    return null;
  }
}

export async function startOrUpdateStreakActivity(
  streak: number,
  endAtMs: number,
  dayKey: string
): Promise<boolean> {
  const mod = nativeModule();
  if (!mod) return false;
  try {
    return await mod.startOrUpdate(streak, endAtMs, dayKey);
  } catch {
    return false;
  }
}

export async function endStreakActivity(): Promise<boolean> {
  const mod = nativeModule();
  if (!mod) return false;
  try {
    return await mod.endAll();
  } catch {
    return false;
  }
}
