import { useEffect, useState } from 'react';
import { supabase, CoupleHistoryRow } from '../../lib/supabase';
import { useSession } from '../auth/useSession';
import { useCouple } from '../pairing/useCouple';
import { ARCHIVE } from '../../content/drop';

interface UseCoupleHistoryReturn {
  history: CoupleHistoryRow[];
  loading: boolean;
  isSample: boolean;
  error: Error | null;
}

export function useCoupleHistory(): UseCoupleHistoryReturn {
  const { session } = useSession();
  const { couple, loading: coupleLoading } = useCouple();
  const [history, setHistory] = useState<CoupleHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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

        // If empty, use sample
        if (!data || (Array.isArray(data) && (data as never[]).length === 0)) {
          const sampleHistory = ARCHIVE.map((d) => ({
            date: new Date().toISOString().split('T')[0],
            code: d.code,
            title: d.title,
            wavelength: d.wave,
            twins_count: d.twins,
          }));
          setHistory(sampleHistory);
        } else if (Array.isArray(data)) {
          setHistory(data as CoupleHistoryRow[]);
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch couple history'));
        // Fall back to sample on error
        const sampleHistory = ARCHIVE.map((d) => ({
          date: new Date().toISOString().split('T')[0],
          code: d.code,
          title: d.title,
          wavelength: d.wave,
          twins_count: d.twins,
        }));
        setHistory(sampleHistory);
        setLoading(false);
      }
    };

    fetchHistory();
  }, [session, couple, coupleLoading]);

  const isSample = !session || !couple || history.length === ARCHIVE.length;

  return { history, loading: loading || coupleLoading, isSample, error };
}
