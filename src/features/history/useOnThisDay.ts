import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSession } from '../auth/useSession';
import { useCouple } from '../pairing/useCouple';
import { useCoupleHistory } from '../lovemap/useCoupleHistory';
import { fetchReveal } from '../drops/dropActions';
import { pickOnThisDay } from './historyStats';
import type { CoupleHistoryRow } from '../../types/db';
import type { PromptAnswers } from '../../domain/reveal';

export interface OnThisDayPrompt {
  id: string;
  emoji: string | null;
  question: string | null;
  options: string[];
}

export interface UseOnThisDayReturn {
  // The chosen memory (highest wave, tie → most recent); null = no real history.
  memory: CoupleHistoryRow | null;
  // The memory's real prompts + both partners' answers, index-aligned.
  prompts: OnThisDayPrompt[];
  answers: PromptAnswers[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * The "on this day" archive moment: picks the couple's most interesting past
 * revealed drop from couple_history, then loads its real prompts and answers
 * via fetchReveal. Only real, revealed history counts — the unauthenticated
 * demo and a history-less couple both get memory: null (the empty state).
 */
export function useOnThisDay(): UseOnThisDayReturn {
  const { session } = useSession();
  const { couple, loading: coupleLoading } = useCouple();
  const { history, loading: historyLoading } = useCoupleHistory();

  const isLive = !!(session && couple);
  const memory = useMemo(
    () => (isLive && !historyLoading ? pickOnThisDay(history) : null),
    [isLive, historyLoading, history]
  );

  const [detail, setDetail] = useState<{
    forDate: string;
    prompts: OnThisDayPrompt[];
    answers: PromptAnswers[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const coupleId = couple?.id ?? null;
  const memoryDate = memory?.date ?? null;

  useEffect(() => {
    if (!coupleId || !memoryDate) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);

    (async () => {
      try {
        // couple_history rows carry no id — the couple_drop is found by its
        // (couple, date), both readable under the couple-membership RLS.
        const { data, error } = await supabase
          .from('couple_drops')
          .select('id')
          .eq('couple_id', coupleId)
          .eq('date', memoryDate)
          .maybeSingle();
        if (cancelled) return;
        if (error) throw error;

        const coupleDropId = (data as { id: string } | null)?.id;
        if (!coupleDropId) return;

        const result = await fetchReveal(coupleDropId);
        if (cancelled) return;
        setDetail({
          forDate: memoryDate,
          prompts: result.prompts,
          answers: result.promptAnswers,
        });
      } catch (err) {
        // The screen still shows the memory's title/date/wave from
        // couple_history; the error lets it offer an honest retry for the
        // answer compare instead of a dead end.
        if (!cancelled) {
          setDetailError(err instanceof Error ? err : new Error('Failed to load the memory answers'));
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [coupleId, memoryDate, reloadKey]);

  // Retry after a failed detail fetch: clears the error, re-enters loading,
  // re-runs the effect (same posture as useCoupleHistory.refetch).
  const refetch = useCallback(() => {
    setDetailError(null);
    setDetailLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  const detailMatches = detail !== null && detail.forDate === memoryDate;

  return {
    memory,
    prompts: detailMatches ? detail.prompts : [],
    answers: detailMatches ? detail.answers : [],
    loading: coupleLoading || historyLoading || detailLoading,
    error: detailError,
    refetch,
  };
}
