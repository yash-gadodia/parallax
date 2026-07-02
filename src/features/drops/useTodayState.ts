import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ensureTodayDrop, getDropContent, getTodayState } from './dropActions';
import type { DropContent } from './dropActions';
import type { TodayState } from '../../types/db';

// supabase.channel(topic) dedupes by topic, so concurrent subscribers must use
// unique topics or .on() throws on the reused, already-subscribed channel.
let todayChannelSeq = 0;

/**
 * Server-rehydrated "today" for the couple: did I answer, did my partner,
 * is the reveal ready, what's the stored wavelength — plus the actual content
 * assigned to today's drop (rotation-aware, migration 0015). If no couple_drop
 * exists yet, it's created (ensure_today_drop is idempotent) so Today always
 * shows the REAL assigned drop, never the static demo content.
 * Live-updates via realtime on couple_drops so the partner's submit flips the
 * UI immediately. Null coupleId (demo / unpaired) returns nulls.
 */
export function useTodayState(coupleId: string | null) {
  const [today, setToday] = useState<TodayState | null>(null);
  const [content, setContent] = useState<DropContent | null>(null);
  const [loading, setLoading] = useState(!!coupleId);

  const refresh = useCallback(async () => {
    if (!coupleId) return;
    let state = await getTodayState(coupleId);
    if (state && !state.exists) {
      try {
        await ensureTodayDrop(coupleId);
        state = await getTodayState(coupleId);
      } catch {
        // Offline / transient failure: keep the honest not-loaded state.
      }
    }
    setToday(state);
    if (state?.couple_drop_id) {
      setContent(await getDropContent(state.couple_drop_id));
    }
    setLoading(false);
  }, [coupleId]);

  useEffect(() => {
    if (!coupleId) {
      setToday(null);
      setContent(null);
      setLoading(false);
      return;
    }

    // cancelled guards the async work so React's double-mount never subscribes
    // a second channel with the same topic.
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    setLoading(true);

    (async () => {
      await refresh();
      if (cancelled) return;

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
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [coupleId, refresh]);

  return { today, content, loading, refresh };
}
