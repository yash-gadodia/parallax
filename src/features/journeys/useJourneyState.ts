import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { JourneyState, JourneyStage } from '../../types/db';
import { getJourneyState } from './journeyActions';

interface UseJourneyStateReturn {
  state: JourneyState | null;
  stages: JourneyStage[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * The couple's journey surface: the get_journey_state RPC (enrollment, stage
 * pointer, check-in flags, progression timestamps) plus the enrolled
 * journey's stage catalog. Null coupleId (demo / unpaired) settles to null —
 * screens fall back to the sample per the isSample pattern.
 */
export function useJourneyState(coupleId: string | null): UseJourneyStateReturn {
  const [state, setState] = useState<JourneyState | null>(null);
  const [stages, setStages] = useState<JourneyStage[]>([]);
  const [loading, setLoading] = useState(!!coupleId);
  const [error, setError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!coupleId) {
      setState(null);
      setStages([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchState = async () => {
      try {
        const next = await getJourneyState(coupleId);
        if (cancelled) return;

        if (next?.exists && next.journey_id) {
          const { data, error: stagesError } = await supabase
            .from('journey_stages')
            .select('*')
            .eq('journey_id', next.journey_id)
            .order('position', { ascending: true });
          if (cancelled) return;
          if (stagesError) throw stagesError;
          setStages((data || []) as unknown as JourneyStage[]);
        } else {
          setStages([]);
        }

        setState(next);
        setError(null);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error('Failed to fetch journey state'));
        setLoading(false);
      }
    };

    fetchState();

    return () => {
      cancelled = true;
    };
  }, [coupleId, reloadKey]);

  const refetch = useCallback(() => {
    setError(null);
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  return { state, stages, loading, error, refetch };
}
