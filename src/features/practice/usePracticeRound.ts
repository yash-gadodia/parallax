import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSession } from '../auth/useSession';
import { useCouple } from '../pairing/useCouple';
import { useCoupleHistory } from '../lovemap/useCoupleHistory';
import { localDayKey } from '../drops/useTodayState';

export const PRACTICE_ROUND_SIZE = 3;
// Enough drops to fill a 3-prompt round even when some prompts lack a partner
// pick, while keeping the read bounded.
const MAX_DROPS = 4;

export interface PracticePrompt {
  id: string;
  emoji: string;
  q: string;
  opts: string[];
  /** The partner's recorded pick for this prompt (always present in a round). */
  partnerPick: number;
}

// xmur3-style string hash: full avalanche, so ids that differ by one char
// still land in a seed-dependent order (djb2 would sort by last char only).
function seedHash(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Random-but-deterministic selection: stable for a given seed (the couple's
 * local day), different across days. No Math.random anywhere.
 */
export function seededPickIds(ids: string[], seed: string, count: number): string[] {
  return [...ids]
    .sort((a, b) => seedHash(`${seed}:${a}`) - seedHash(`${seed}:${b}`))
    .slice(0, count);
}

export interface UsePracticeRoundReturn {
  /** Exactly PRACTICE_ROUND_SIZE prompts when a round is ready. */
  prompts: PracticePrompt[];
  loading: boolean;
  error: boolean;
  /** True (and honest) when the couple has <3 revealed prompts with partner picks. */
  notEnough: boolean;
  retry: () => void;
}

/**
 * A solo practice round: 3 prompts from the couple's REVEALED history, each
 * with the partner's recorded pick, chosen deterministically by couple-local
 * date. Read-only by construction — the reveal-gate RLS already exposes
 * partner answers for revealed drops, and nothing here writes to the server.
 */
export function usePracticeRound(now: () => Date = () => new Date()): UsePracticeRoundReturn {
  const { session } = useSession();
  const { couple, loading: coupleLoading } = useCouple();
  const { history, loading: historyLoading, error: historyError, refetch } = useCoupleHistory();

  const [prompts, setPrompts] = useState<PracticePrompt[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const isLive = !!(session && couple);
  const coupleId = couple?.id ?? null;
  const dayKey = localDayKey(now());

  useEffect(() => {
    if (!coupleId || !isLive || historyLoading || historyError) return;

    // Demo/sample rows carry no real couple_drop_id — only real reveals count.
    const revealedIds = history.map((r) => r.couple_drop_id).filter(Boolean);
    if (revealedIds.length === 0) {
      setPrompts([]);
      return;
    }

    const seed = `${coupleId}:${dayKey}`;
    const dropIds = seededPickIds(revealedIds, seed, MAX_DROPS);

    let cancelled = false;
    setFailed(false);
    setPrompts(null);

    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const myId = userData?.user?.id;
        if (!myId) throw new Error('no session user');

        const { data: coupleDrops, error: cdError } = await supabase
          .from('couple_drops')
          .select('id, drop_id')
          .in('id', dropIds);
        if (cdError) throw cdError;
        const catalogIds = ((coupleDrops || []) as Array<{ id: string; drop_id: string }>).map(
          (cd) => cd.drop_id
        );
        if (catalogIds.length === 0) throw new Error('no drops found');

        const [promptsRes, answersRes] = await Promise.all([
          supabase
            .from('drop_prompts')
            .select('id, emoji, question, options')
            .in('drop_id', catalogIds)
            .order('position', { ascending: true }),
          supabase
            .from('answers')
            .select('prompt_id, author, pick')
            .in('couple_drop_id', dropIds),
        ]);
        if (promptsRes.error) throw promptsRes.error;
        if (answersRes.error) throw answersRes.error;

        const partnerPickByPrompt = new Map<string, number>();
        for (const a of (answersRes.data || []) as Array<{
          prompt_id: string;
          author: string;
          pick: number | null;
        }>) {
          if (a.author !== myId && a.pick !== null) {
            partnerPickByPrompt.set(a.prompt_id, a.pick);
          }
        }

        const pool: PracticePrompt[] = (
          (promptsRes.data || []) as Array<{
            id: string;
            emoji: string | null;
            question: string | null;
            options: string[];
          }>
        )
          .filter((p) => partnerPickByPrompt.has(p.id))
          .map((p) => ({
            id: p.id,
            emoji: p.emoji ?? '💬',
            q: p.question ?? '',
            opts: p.options,
            partnerPick: partnerPickByPrompt.get(p.id) as number,
          }));

        if (cancelled) return;
        if (pool.length < PRACTICE_ROUND_SIZE) {
          setPrompts([]);
          return;
        }
        const chosenIds = seededPickIds(
          pool.map((p) => p.id),
          seed,
          PRACTICE_ROUND_SIZE
        );
        setPrompts(
          chosenIds.map((id) => pool.find((p) => p.id === id) as PracticePrompt)
        );
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [coupleId, isLive, historyLoading, historyError, history, dayKey, reloadKey]);

  const retry = useCallback(() => {
    setFailed(false);
    setPrompts(null);
    if (historyError) refetch();
    setReloadKey((k) => k + 1);
  }, [historyError, refetch]);

  const error = failed || !!historyError;
  const loading =
    !error && (coupleLoading || historyLoading || (isLive && prompts === null));
  const ready = prompts !== null && prompts.length === PRACTICE_ROUND_SIZE;
  const notEnough = !error && !loading && !ready;

  return {
    prompts: ready ? prompts : [],
    loading,
    error,
    notEnough,
    retry,
  };
}
