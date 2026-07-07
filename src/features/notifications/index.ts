import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../../lib/supabase';

const DAILY_NUDGE_ID = 'parallax-daily-nudge';

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

// 2.2: while pairing is pending, two gentle local reminders to the INVITER
// (+24h and +72h) — the second-partner window is where activation dies.
// Warm, never guilt; cancelled the moment the partner joins.
const PENDING_REMINDER_IDS = ['pending-invite-24h', 'pending-invite-72h'] as const;

export async function schedulePendingReminders(partnerHint?: string): Promise<void> {
  if (!isAvailable()) return;
  try {
    const granted = await requestPermissions();
    if (!granted) return;

    await cancelPendingReminders();

    const who = partnerHint?.trim() ? partnerHint.trim() : 'your person';
    const plans: Array<{ id: (typeof PENDING_REMINDER_IDS)[number]; seconds: number; body: string }> = [
      {
        id: 'pending-invite-24h',
        seconds: 24 * 60 * 60,
        body: `${who} hasn't joined yet — want to resend your invite?`,
      },
      {
        id: 'pending-invite-72h',
        seconds: 72 * 60 * 60,
        body: `your invite is still waiting for ${who}. a nudge in person works wonders 💛`,
      },
    ];
    for (const p of plans) {
      await Notifications.scheduleNotificationAsync({
        identifier: p.id,
        content: {
          title: 'Still just you in here',
          body: p.body,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: p.seconds,
        },
      });
    }
  } catch {
    // no-op: local scheduling failure must never crash the app
  }
}

export async function cancelPendingReminders(): Promise<void> {
  if (!isAvailable()) return;
  try {
    for (const id of PENDING_REMINDER_IDS) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
  } catch {
    // ignore — notifications may not exist yet
  }
}

// Invoke the notify-partner edge function after a drop submission.
// Fire-and-forget — errors are swallowed so they never interrupt the submit flow.
// GATE: delivers only once Yash adds EAS/APNs creds + real push tokens.
export async function notifyPartner(
  coupleDropId: string,
  event: 'played' | 'revealed'
): Promise<void> {
  try {
    await supabase.functions.invoke('notify-partner', {
      body: { couple_drop_id: coupleDropId, event },
    });
  } catch {
    // No-op: network failure or missing edge-fn creds must never crash the app.
  }
}

// Push a nudge to the partner after nudge_partner succeeds. The edge function
// identifies the nudger from the JWT `sub` and targets the OTHER member.
// No-op without a session (demo/solo mode). Fire-and-forget.
// GATE: delivers only once push tokens + the deployed edge fn are live.
export async function notifyNudge(coupleId: string): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;
    await supabase.functions.invoke('notify-partner', {
      body: { couple_id: coupleId, event: 'nudge' },
    });
  } catch {
    // No-op: push failure must never interrupt the nudge flow.
  }
}

// Push a gentle "add your side" to the partner after start_refocus succeeds.
// The edge function identifies the initiator from the JWT `sub` and targets the
// OTHER member. No-op without a session (demo/solo mode). Fire-and-forget.
// GATE: delivers only once push tokens + the deployed edge fn are live.
export async function notifyRefocus(
  coupleId: string,
  sessionId?: string
): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;
    await supabase.functions.invoke('notify-partner', {
      body: {
        couple_id: coupleId,
        event: 'refocus',
        // V2 F1: lets the edge fn include the topic in the async phrasing —
        // it re-reads and validates the session server-side, never the body.
        ...(sessionId ? { refocus_session_id: sessionId } : {}),
      },
    });
  } catch {
    // No-op: push failure must never interrupt the refocus flow.
  }
}

// Notify the waiting partner (member_a) that someone just joined their couple.
// Fired right after join_couple succeeds. Fire-and-forget.
// GATE: delivers only once push tokens + the deployed edge fn are live.
export async function notifyPaired(coupleId: string): Promise<void> {
  try {
    await supabase.functions.invoke('notify-partner', {
      body: { couple_id: coupleId, event: 'paired' },
    });
  } catch {
    // No-op: must never interrupt the pairing success flow.
  }
}

// Get the Expo push token and persist it to profiles.push_token.
// GATE: only works with a real EAS project + APNs/FCM credentials.
export async function registerPushToken(): Promise<void> {
  if (!isAvailable()) return;
  try {
    const granted = await requestPermissions();
    if (!granted) return;

    // Standalone (EAS) builds need the project ID to mint a push token, or this
    // throws and no token is ever registered. Read it from app.json (set by eas init).
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
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
