import { useCallback, useEffect, useState } from 'react';
import { supabase, CoupleHistoryRow } from '../../lib/supabase';
import { useSession } from '../auth/useSession';
import { useCouple } from '../pairing/useCouple';
import { ARCHIVE } from '../../content/drop';

interface UseCoupleHistoryReturn {
  history: CoupleHistoryRow[];
  loading: boolean;
  isSample: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCoupleHistory(): UseCoupleHistoryReturn {
  const { session } = useSession();
  const { couple, loading: coupleLoading } = useCouple();
  const [history, setHistory] = useState<CoupleHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // No session or no couple: use sample
        if (!session || !couple) {
          const sampleHistory = ARCHIVE.map((d) => ({
            date: new Date().toISOString().split('T')[0],
            code: d.code,
            title: d.title,
            wavelength: d.wave,
            twins_count: d.twins,
          }));
          setHistory(sampleHistory);
          setLoading(false);
          return;
        }

        // Fetch couple history from Supabase
        const { data, error: fetchError } = await supabase.rpc(
          'couple_history' as never,
          { p_couple: couple.id } as never
        );

        if (fetchError) throw fetchError;

        // Real couple with no history yet: show empty (real empty state), never sample
        if (!data || (Array.isArray(data) && (data as never[]).length === 0)) {
          setHistory([]);
        } else if (Array.isArray(data)) {
          setHistory(data as CoupleHistoryRow[]);
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch couple history'));
        // Real couple (demo path returned earlier): show empty, never sample
        setHistory([]);
        setLoading(false);
      }
    };

    fetchHistory();
  }, [session, couple, coupleLoading, reloadKey]);

  // Retry after a failed fetch: clears the error, re-enters loading, re-runs
  // the effect. Screens surface this as their honest "try again" action.
  const refetch = useCallback(() => {
    setError(null);
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  const isSample = !session || !couple || history.length === ARCHIVE.length;

  return { history, loading: loading || coupleLoading, isSample, error, refetch };
}
