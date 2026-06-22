import { useEffect, useState } from 'react';
import { supabase, Learning } from '../../lib/supabase';
import { useSession } from '../auth/useSession';
import { useCouple } from '../pairing/useCouple';
import { LEARNINGS } from '../../content/us';

interface UseLearningsReturn {
  items: Learning[];
  loading: boolean;
  isSample: boolean;
  error: Error | null;
}

export function useLearnings(): UseLearningsReturn {
  const { session } = useSession();
  const { couple, loading: coupleLoading } = useCouple();
  const [items, setItems] = useState<Learning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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

        // If empty, use sample
        if (!data || data.length === 0) {
          const sampleLearnings: Learning[] = LEARNINGS.map((l) => ({
            id: l.id,
            couple_id: couple.id,
            about: l.who === 'you' ? session.user.id : couple.member_a === session.user.id ? couple.member_b || '' : couple.member_a,
            emoji: l.emoji,
            need: l.need,
            detail: l.detail,
            source: l.from as 'drop' | 'refocus',
            origin: l.origin,
            mastery: l.mastery,
            became_prompt_id: l.becameQ ? 'prompt-' + l.id : null,
            became_question: l.becameQ,
            created_at: new Date().toISOString(),
          }));
          setItems(sampleLearnings);
        } else {
          setItems(data);
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch learnings'));
        // Fall back to sample on error
        const sampleLearnings: Learning[] = LEARNINGS.map((l) => ({
          id: l.id,
          couple_id: couple?.id || '',
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
      }
    };

    fetchLearnings();
  }, [session, couple, coupleLoading]);

  const isSample = !session || !couple || items.some((i) => LEARNINGS.find((l) => l.id === i.id));

  return { items, loading: loading || coupleLoading, isSample, error };
}
