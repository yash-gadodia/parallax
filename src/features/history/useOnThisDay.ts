import { useEffect, useMemo, useState } from 'react';
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
        if (cancelled || error) return;

        const coupleDropId = (data as { id: string } | null)?.id;
        if (!coupleDropId) return;

        const result = await fetchReveal(coupleDropId);
        if (cancelled) return;
        setDetail({
          forDate: memoryDate,
          prompts: result.prompts,
          answers: result.promptAnswers,
        });
      } catch {
        // Quiet failure: the screen still shows the memory's title/date/wave
        // from couple_history; only the answer compare stays unavailable.
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [coupleId, memoryDate]);

  const detailMatches = detail !== null && detail.forDate === memoryDate;

  return {
    memory,
    prompts: detailMatches ? detail.prompts : [],
    answers: detailMatches ? detail.answers : [],
    loading: coupleLoading || historyLoading || detailLoading,
  };
}
