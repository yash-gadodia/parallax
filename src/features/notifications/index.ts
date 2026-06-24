import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../../lib/supabase';

// GATE: fully fires only once EAS/APNs creds are added by Yash.
// All functions no-op gracefully when:
//   - running in Expo Go (no push entitlement)
//   - permissions denied
//   - module unavailable

function isAvailable(): boolean {
  // expo-notifications doesn't work in Expo Go on simulators for remote push,
  // but local notifications work. We guard against thrown errors below.
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export async function requestPermissions(): Promise<boolean> {
  if (!isAvailable()) return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// Schedule (or re-schedule) a daily local notification at the given HH:MM time.
// notifyTime: "HH:MM" string (24h) as stored in profiles.notify_time.
export async function scheduleDailyNudge(notifyTime: string): Promise<void> {
  if (!isAvailable()) return;
  try {
    const granted = await requestPermissions();
    if (!granted) return;

    const [hhStr, mmStr] = notifyTime.split(':');
    const hour = parseInt(hhStr, 10);
    const minute = parseInt(mmStr, 10);
    if (isNaN(hour) || isNaN(minute)) return;

    // Cancel any existing daily nudge before rescheduling.
    await cancelDailyNudge();

    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_NUDGE_ID,
      content: {
        title: "Today's drop is waiting 💛",
        body: "Tap to answer, then see what your person said.",
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  } catch {
    // no-op: local scheduling failure must never crash the app
  }
}

export async function cancelDailyNudge(): Promise<void> {
  if (!isAvailable()) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_NUDGE_ID);
  } catch {
    // ignore — notification may not exist yet
  }
}

// Get the Expo push token and persist it to profiles.push_token.
// GATE: only works with a real EAS project + APNs/FCM credentials.
export async function registerPushToken(): Promise<void> {
  if (!isAvailable()) return;
  try {
    const granted = await requestPermissions();
    if (!granted) return;

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    if (!token) return;

    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    if (!uid) return;

    // @ts-expect-error supabase-js typed update arg resolves to never for this table
    await supabase.from('profiles').update({ push_token: token }).eq('id', uid);
  } catch {
    // GATE: getExpoPushTokenAsync throws in Expo Go without EAS project ID.
    // No-op so the demo never crashes.
  }
}

const DAILY_NUDGE_ID = 'parallax-daily-nudge';
