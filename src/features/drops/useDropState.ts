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

    let cleanup: (() => void) | null = null;

    const fetchDrop = async () => {
      try {
        const { data, error } = await supabase
          .from('couple_drops')
          .select('id, state')
          .eq('id', couplDropId)
          .maybeSingle();

        if (error) throw error;

        setState((prev) => ({
          ...prev,
          coupleDrop: data || null,
          loading: false,
        }));

        if (data) {
          const channel = supabase
            .channel(`couple-drop-${couplDropId}`)
            .on(
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
            )
            .subscribe();

          cleanup = () => {
            supabase.removeChannel(channel);
          };
        }
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err : new Error('Unknown error'),
          loading: false,
        }));
      }
    };

    fetchDrop();

    return () => {
      if (cleanup) cleanup();
    };
  }, [couplDropId]);

  return state;
}
