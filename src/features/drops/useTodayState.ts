import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { getTodayState } from './dropActions';
import type { TodayState } from '../../types/db';

// supabase.channel(topic) dedupes by topic, so concurrent subscribers must use
// unique topics or .on() throws on the reused, already-subscribed channel.
let todayChannelSeq = 0;

/**
 * Server-rehydrated "today" for the couple: did I answer, did my partner,
 * is the reveal ready, what's the stored wavelength. Live-updates via
 * realtime on couple_drops so the partner's submit flips the UI immediately.
 * Null coupleId (demo / unpaired) returns { today: null }.
 */
export function useTodayState(coupleId: string | null) {
  const [today, setToday] = useState<TodayState | null>(null);
  const [loading, setLoading] = useState(!!coupleId);

  const refresh = useCallback(async () => {
    if (!coupleId) return;
    const state = await getTodayState(coupleId);
    setToday(state);
    setLoading(false);
  }, [coupleId]);

  useEffect(() => {
    if (!coupleId) {
      setToday(null);
      setLoading(false);
      return;
    }

    // cancelled guards the async work so React's double-mount never subscribes
    // a second channel with the same topic.
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    setLoading(true);

    (async () => {
      const state = await getTodayState(coupleId);
      if (cancelled) return;
      setToday(state);
      setLoading(false);

      if (!cancelled) {
        channel = supabase
          .channel(`today-state-${coupleId}-${++todayChannelSeq}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'couple_drops',
              filter: `couple_id=eq.${coupleId}`,
            },
            () => {
              refresh();
            }
          );
        channel.subscribe();
      }
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [coupleId, refresh]);

  return { today, loading, refresh };
}
