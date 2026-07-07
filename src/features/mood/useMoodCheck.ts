import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { useUiStore } from '../../store/ui';
import { track, EVENTS } from '../../lib/analytics';
import type { Mood } from '../../content/mood';
import { coupleLocalDateKey } from './moodLogic';

// One-per-couple-local-day dedupe key for "not now" (the server row keeps the
// mood; dismissal of the offer is a device-local courtesy).
const OFFER_DISMISSED_KEY = 'parallax:mood_offer_dismissed_on';

/**
 * Today's mood-check state for me: the server row (if I already answered),
 * whether the offer was dismissed today, and the submit/dismiss actions.
 * Server-side dedup is the unique (couple_id, user_id, couple_local_date)
 * constraint — this hook only reads/writes through it.
 */
export function useMoodCheck(args: {
  coupleId: string | null;
  userId: string | null;
  tz: string | null | undefined;
  now?: () => Date;
}) {
  const { coupleId, userId, tz, now = () => new Date() } = args;
  const dateKey = coupleLocalDateKey(now(), tz);

  const [loading, setLoading] = useState(!!coupleId);
  const [mood, setMood] = useState<Mood | null>(null);
  const [pickedThisSession, setPickedThisSession] = useState(false);
  const [offerDismissedToday, setOfferDismissedToday] = useState(false);

  useEffect(() => {
    if (!coupleId || !userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [{ data }, dismissedOn] = await Promise.all([
          supabase
            .from('mood_checks')
            .select('mood')
            .eq('couple_id', coupleId)
            .eq('user_id', userId)
            .eq('couple_local_date', dateKey)
            .maybeSingle(),
          AsyncStorage.getItem(OFFER_DISMISSED_KEY),
        ]);
        if (cancelled) return;
        // supabase-js typed select infers never (known quirk, database.md).
        const row = data as { mood: Mood } | null;
        if (row?.mood) setMood(row.mood);
        setOfferDismissedToday(dismissedOn === dateKey);
      } catch {
        // offline — leave the honest defaults (no mood, nothing dismissed)
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [coupleId, userId, dateKey]);

  const pick = useCallback(
    async (next: Mood) => {
      if (!coupleId) return;
      const previous = mood;
      setMood(next);
      setPickedThisSession(true);
      // @ts-expect-error supabase-js typed rpc args resolve to never (known quirk, database.md)
      const { error } = await supabase.rpc('submit_mood_check', {
        p_couple: coupleId,
        p_mood: next,
      });
      if (error) {
        setMood(previous);
        setPickedThisSession(false);
        useUiStore.getState().fireToast("that didn't save — try again");
        return;
      }
      track(EVENTS.MOOD_CHECK, { mood: next });
    },
    [coupleId, mood]
  );

  // Accepting the offer ("let's talk") also suppresses it for the day — but
  // only an explicit "not now" counts toward the dismissal-rate tone canary.
  const suppressOfferToday = useCallback(() => {
    setOfferDismissedToday(true);
    AsyncStorage.setItem(OFFER_DISMISSED_KEY, dateKey).catch(() => {});
  }, [dateKey]);

  const dismissOffer = useCallback(() => {
    suppressOfferToday();
    track(EVENTS.MOOD_CHECK_DISMISSED);
  }, [suppressOfferToday]);

  return {
    loading,
    mood,
    pickedThisSession,
    offerDismissedToday,
    pick,
    dismissOffer,
    suppressOfferToday,
  };
}
