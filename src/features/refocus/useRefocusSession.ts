import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { RefocusSession } from '../../types/db';

// supabase.channel(topic) dedupes by topic, so concurrent subscribers must use
// unique topics or .on() throws on the reused, already-subscribed channel
// (same pattern as useDropState / useCouple).
let refocusChannelSeq = 0;

interface RefocusSessionState {
  session: RefocusSession | null;
  loading: boolean;
  error: Error | null;
}

/**
 * The couple's current two-sided refocus session, live.
 *
 * Fetches the most recent OPEN session (waiting_partner / ready) for the
 * couple, then subscribes to realtime changes on the couple's
 * refocus_sessions rows so both phones see waiting_partner -> ready ->
 * revealed the moment it happens (RLS scopes what each subscriber receives).
 * A session revealed while mounted stays in state so the initiator's waiting
 * screen can flow straight into the shared result.
 */
export function useRefocusSession(coupleId: string | null): RefocusSessionState & {
  refresh: () => Promise<void>;
} {
  const [state, setState] = useState<RefocusSessionState>({
    session: null,
    loading: true,
    error: null,
  });

  const fetchOpen = useCallback(async (): Promise<RefocusSession | null> => {
    if (!coupleId) return null;
    const { data, error } = await supabase
      .from('refocus_sessions')
      .select('*')
      .eq('couple_id', coupleId)
      .in('state', ['waiting_partner', 'ready'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data as RefocusSession | null) ?? null;
  }, [coupleId]);

  const refresh = useCallback(async () => {
    try {
      const session = await fetchOpen();
      setState({ session, loading: false, error: null });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err : new Error('Unknown error'),
      }));
    }
  }, [fetchOpen]);

  useEffect(() => {
    if (!coupleId) {
      setState({ session: null, loading: false, error: null });
      return;
    }

    // cancelled guards the async work so React's double-mount never subscribes
    // a second channel with the same topic.
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const run = async () => {
      try {
        const session = await fetchOpen();
        if (cancelled) return;
        setState({ session, loading: false, error: null });

        channel = supabase
          .channel(`refocus-${coupleId}-${++refocusChannelSeq}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'refocus_sessions',
              filter: `couple_id=eq.${coupleId}`,
            },
            (payload) => {
              const next = payload.new as RefocusSession | null;
              if (!next?.id) return;
              setState((prev) => {
                // A brand-new session, or an update to the one we hold.
                if (!prev.session || prev.session.id === next.id) {
                  return { ...prev, session: next };
                }
                return prev;
              });
            }
          );
        channel.subscribe();
      } catch (err) {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err : new Error('Unknown error'),
        }));
      }
    };

    run();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [coupleId, fetchOpen]);

  return { ...state, refresh };
}
