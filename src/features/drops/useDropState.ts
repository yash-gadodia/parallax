import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { CoupleDrop } from '../../types/db';

// supabase.channel(topic) dedupes by topic, so concurrent subscribers must use
// unique topics or .on() throws on the reused, already-subscribed channel.
let dropChannelSeq = 0;

interface DropState {
  coupleDrop: Pick<CoupleDrop, 'id' | 'state'> | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to subscribe to couple_drop state changes in real-time.
 * Useful for waiting.tsx to detect when partner has answered.
 */
export function useDropState(couplDropId: string | null): DropState & { refetch: () => void } {
  const [state, setState] = useState<DropState>({
    coupleDrop: null,
    loading: true,
    error: null,
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!couplDropId) {
      setState({ coupleDrop: null, loading: false, error: null });
      return;
    }

    // cancelled guards the async work so React's double-mount never subscribes a
    // second channel with the same topic ("cannot add callbacks after subscribe()").
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetchDrop = async () => {
      try {
        const { data, error } = await supabase
          .from('couple_drops')
          .select('id, state')
          .eq('id', couplDropId)
          .maybeSingle();

        if (cancelled) return;
        if (error) throw error;

        setState((prev) => ({
          ...prev,
          coupleDrop: data || null,
          loading: false,
        }));

        if (data && !cancelled) {
          channel = supabase.channel(`couple-drop-${couplDropId}-${++dropChannelSeq}`).on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'couple_drops',
              filter: `id=eq.${couplDropId}`,
            },
            (payload) => {
              const newDrop = payload.new as CoupleDrop | null;
              if (newDrop) {
                setState((prev) => ({
                  ...prev,
                  coupleDrop: {
                    id: newDrop.id,
                    state: newDrop.state,
                  },
                }));
              }
            }
          );
          channel.subscribe();
        }
      } catch (err) {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err : new Error('Unknown error'),
          loading: false,
        }));
      }
    };

    fetchDrop();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [couplDropId, reloadKey]);

  // Retry after a failed fetch/subscribe: clears the error, re-enters loading,
  // re-runs the effect (same posture as useCoupleHistory.refetch).
  const refetch = useCallback(() => {
    setState({ coupleDrop: null, loading: true, error: null });
    setReloadKey((k) => k + 1);
  }, []);

  return { ...state, refetch };
}
