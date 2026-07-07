import AsyncStorage from '@react-native-async-storage/async-storage';

export const EVENTS = {
  APP_OPEN: 'app_open',
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  // 2.5 funnel: created (couple exists, partner pending) is distinct from
  // paired (both in); first mutual reveal is the activation aha.
  COUPLE_CREATED: 'couple_created',
  COUPLE_PAIRED: 'couple_paired',
  DROP_SUBMITTED: 'drop_submitted',
  REVEAL_VIEWED: 'reveal_viewed',
  FIRST_MUTUAL_REVEAL: 'first_mutual_reveal',
  // D0 activation funnel events
  INVITE_SHARED: 'invite_shared',
  INVITE_LINK_OPENED: 'invite_link_opened',
  PARTNER_JOINED: 'partner_joined',
  FIRST_ANSWER_SUBMITTED: 'first_answer_submitted',
  D0_MUTUAL_REVEAL: 'd0_mutual_reveal',
  // 0027 north star: post-reveal "did this bring you closer?" micro-signal.
  CLOSENESS_FEEDBACK: 'closeness_feedback',
  REFOCUS_COMPLETED: 'refocus_completed',
  // V2 fight-flywheel funnel (V2_PLAN §7 / §11.8).
  // mood_check_shown vs mood_check is the dismissal-rate tone canary
  // (>70% skip = the greeting is noise).
  MOOD_CHECK_SHOWN: 'mood_check_shown',
  MOOD_CHECK: 'mood_check',
  MOOD_CHECK_DISMISSED: 'mood_check_dismissed',
  REFOCUS_STARTED: 'refocus_started',
  REFOCUS_PERSISTED: 'refocus_persisted',
  REPAIR_VERDICT: 'repair_verdict',
  REPAIR_REVEALED: 'repair_revealed',
  PAYWALL_VIEWED: 'paywall_viewed',
  PURCHASE_COMPLETED: 'purchase_completed',
  ACCOUNT_DELETED: 'account_deleted',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

type Props = Record<string, string | number | boolean>;

const ANON_ID_KEY = '@parallax/anon_id';

let enabled = false;
let endpoint = '';
let apiKey = '';
let userId: string | null = null;
let anonId: string | null = null;

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function getOrCreateAnonId(): Promise<string> {
  if (anonId) return anonId;
  try {
    const stored = await AsyncStorage.getItem(ANON_ID_KEY);
    if (stored) {
      anonId = stored;
      return anonId;
    }
    const fresh = uuid();
    await AsyncStorage.setItem(ANON_ID_KEY, fresh);
    anonId = fresh;
    return anonId;
  } catch {
    return uuid();
  }
}

export function init(): void {
  const key = process.env.EXPO_PUBLIC_ANALYTICS_KEY;
  if (!key) {
    enabled = false;
    return;
  }
  apiKey = key;
  endpoint = process.env.EXPO_PUBLIC_ANALYTICS_HOST
    ? `${process.env.EXPO_PUBLIC_ANALYTICS_HOST}/capture`
    : 'https://us.i.posthog.com/capture';
  enabled = true;
}

export function identify(id: string): void {
  userId = id;
  if (!enabled) return;
  getOrCreateAnonId().then((anon) => {
    sendEvent('$identify', {
      $anon_distinct_id: anon,
      $set: { user_id: id },
    });
  });
}

export function reset(): void {
  userId = null;
  anonId = null;
}

export function track(event: EventName, props?: Props): void {
  if (!enabled) return;
  getOrCreateAnonId().then((anon) => {
    sendEvent(event, { ...props, distinct_id: userId ?? anon });
  });
}

export function captureError(error: unknown, context?: Props): void {
  if (!enabled) {
    if (__DEV__) {
      console.warn('[analytics] error (no-op, key not set):', error);
    }
    return;
  }
  const message = error instanceof Error ? error.message : String(error);
  getOrCreateAnonId().then((anon) => {
    sendEvent('$exception', {
      $exception_message: message,
      ...context,
      distinct_id: userId ?? anon,
    });
  });
}

function sendEvent(event: string, props: Record<string, unknown>): void {
  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey, event, properties: props }),
  }).catch(() => {});
}
