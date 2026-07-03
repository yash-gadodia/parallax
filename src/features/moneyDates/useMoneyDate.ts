import { useCallback, useEffect, useState } from 'react';
import { useSession } from '../auth/useSession';
import { useCouple } from '../pairing/useCouple';
import { fetchMoneyDateState } from './moneyDateActions';
import type { MoneyDateState } from '../../types/db';

interface UseMoneyDateReturn {
  /** Real server state; null while loading / in demo / on error. */
  state: MoneyDateState | null;
  coupleId: string | null;
  loading: boolean;
  /** No session or no couple — the demo flow runs locally, nothing persists. */
  isSample: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * The couple's money-date surface: the resumable open session (if any) plus
 * the last completed date for the Us row. Demo fallback follows the
 * useLearnings pattern: unauthenticated/unpaired -> isSample, never a crash;
 * a real couple whose fetch fails gets an honest error, never fake data.
 */
export function useMoneyDate(): UseMoneyDateReturn {
  const { session } = useSession();
  const { couple, loading: coupleLoading } = useCouple();
  const [state, setState] = useState<MoneyDateState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const isSample = !session || (!couple && !coupleLoading);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!session || coupleLoading) return;
      if (!couple) {
        setState(null);
        setLoading(false);
        return;
      }
      try {
        const next = await fetchMoneyDateState(couple.id);
        if (cancelled) return;
        setState(next);
        setError(null);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setState(null);
        setError(err instanceof Error ? err : new Error('Failed to fetch money date state'));
        setLoading(false);
      }
    };

    if (!session) {
      // Demo: nothing to fetch, nothing to fake.
      setState(null);
      setLoading(false);
      return;
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [session, couple, coupleLoading, reloadKey]);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }, []);

  return {
    state,
    coupleId: couple?.id ?? null,
    loading: loading || coupleLoading,
    isSample,
    error,
    refetch,
  };
}
