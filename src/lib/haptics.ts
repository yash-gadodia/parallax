import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Thin, safe wrappers over expo-haptics. Every call is a no-op on web and
// swallows native failures (simulator, jest) — a haptic must never crash a
// celebration.

const supported = Platform.OS === 'ios' || Platform.OS === 'android';

async function safely(fn: () => Promise<unknown>): Promise<void> {
  if (!supported) return;
  try {
    await fn();
  } catch {
    // no-op: haptics are decorative
  }
}

/** Tiny selection blip — picking an option, toggling a reaction. */
export function selection(): Promise<void> {
  return safely(() => Haptics.selectionAsync());
}

/** Light impact tick — one step of a climbing counter/ring. */
export function lightTick(): Promise<void> {
  return safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** Success thump — the ring landing on its number. */
export function success(): Promise<void> {
  return safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Celebration pattern — success thump followed by two quick light ticks.
 * Used at earned peaks (milestones, big reveals).
 */
export function celebration(): Promise<void> {
  return safely(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await delay(120);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await delay(90);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  });
}
