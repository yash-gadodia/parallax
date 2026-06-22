import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { CoupleDrop } from '../../types/db';

interface DropState {
  coupleDrop: Pick<CoupleDrop, 'id' | 'state'> | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to subscribe to couple_drop state changes in real-time.
 * Useful for waiting.tsx to detect when partner has answered.
 */
export function useDropState(couplDropId: string | null): DropState {
  const [state, setState] = useState<DropState>({
    coupleDrop: null,
    loading: true,
    error: null,
  });

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
          channel = supabase.channel(`couple-drop-${couplDropId}`).on(
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
  }, [couplDropId]);

  return state;
}
