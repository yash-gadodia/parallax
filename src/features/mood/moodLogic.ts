import type { Mood } from '../../content/mood';

// Pure mood-check logic (RN-free, exact-testable).

/** off/heavy are the rough day-words that earn the quiet Refocus offer. */
export function isRoughMood(mood: Mood): boolean {
  return mood === 'off' || mood === 'heavy';
}

/**
 * 'YYYY-MM-DD' in the couple's timezone — the same couple-local-date primitive
 * the server uses for drops and mood dedup (midnight-safe, DST-safe). Falls
 * back to the device-local date if the tz string is invalid.
 */
export function coupleLocalDateKey(now: Date, tz: string | null | undefined): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz || 'Asia/Singapore',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
  } catch {
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${m}-${d}`;
  }
}

export type MoodCardState =
  | { kind: 'hidden' }
  | { kind: 'greeting' }
  | { kind: 'ack' }
  | { kind: 'offer' };

/**
 * The card's whole state machine in one pure function (V2_PLAN §10):
 * - the greeting is skipped on any day the couple already played
 * - a bright pick shows a transient ack this session, nothing next open
 * - a rough pick expands into the offer until acted on ("not now" / "let's talk")
 * - the card never reappears after dismissal that day
 */
export function moodCardState(args: {
  flagOn: boolean;
  isLive: boolean;
  playedToday: boolean;
  mood: Mood | null;
  pickedThisSession: boolean;
  offerDismissedToday: boolean;
}): MoodCardState {
  const { flagOn, isLive, playedToday, mood, pickedThisSession, offerDismissedToday } = args;
  if (!flagOn || !isLive) return { kind: 'hidden' };
  if (mood === null) {
    return playedToday ? { kind: 'hidden' } : { kind: 'greeting' };
  }
  if (isRoughMood(mood)) {
    if (playedToday || offerDismissedToday) return { kind: 'hidden' };
    return { kind: 'offer' };
  }
  return pickedThisSession ? { kind: 'ack' } : { kind: 'hidden' };
}
