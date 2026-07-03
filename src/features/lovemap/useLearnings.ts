import { useCallback, useEffect, useState } from 'react';
import { supabase, Learning } from '../../lib/supabase';
import { useSession } from '../auth/useSession';
import { useCouple } from '../pairing/useCouple';
import { LEARNINGS } from '../../content/us';

interface UseLearningsReturn {
  items: Learning[];
  loading: boolean;
  isSample: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useLearnings(): UseLearningsReturn {
  const { session } = useSession();
  const { couple, loading: coupleLoading } = useCouple();
  const [items, setItems] = useState<Learning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const fetchLearnings = async () => {
      try {
        // No session or no couple: use sample
        if (!session || !couple) {
          const sampleLearnings: Learning[] = LEARNINGS.map((l) => ({
            id: l.id,
            couple_id: '',
            about: l.who === 'you' ? 'you' : 'partner',
            emoji: l.emoji,
            need: l.need,
            detail: l.detail,
            source: l.from,
            origin: l.origin,
            mastery: l.mastery,
            became_prompt_id: l.becameQ ? 'prompt-' + l.id : null,
            became_question: l.becameQ,
            created_at: new Date().toISOString(),
          }));
          setItems(sampleLearnings);
          setLoading(false);
          return;
        }

        // Fetch learnings from Supabase
        const { data, error: fetchError } = await supabase
          .from('learnings')
          .select('*')
          .eq('couple_id', couple.id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        // Real couple with no data yet: show empty (real empty state), never sample
        if (!data || data.length === 0) {
          setItems([]);
        } else {
          // Normalize `about` (stored as a member UUID) to 'you'/'partner' so the
          // UI's who-chip resolves correctly regardless of which partner is viewing.
          setItems(
            (data as Learning[]).map((d) => ({
              ...d,
              about: d.about === session.user.id ? 'you' : 'partner',
            }))
          );
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch learnings'));
        // Real couple (demo path returned earlier): show empty, never sample
        setItems([]);
        setLoading(false);
      }
    };

    fetchLearnings();
  }, [session, couple, coupleLoading, reloadKey]);

  // Retry after a failed fetch: clears the error, re-enters loading, re-runs
  // the effect. Screens surface this as their honest "try again" action.
  const refetch = useCallback(() => {
    setError(null);
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  // Sample-ness is an AUTH fact, never a data-shape guess (same rule as
  // useCoupleHistory): only the signed-out / unpaired demo is a sample.
  const isSample = !session || !couple;

  return { items, loading: loading || coupleLoading, isSample, error, refetch };
}
