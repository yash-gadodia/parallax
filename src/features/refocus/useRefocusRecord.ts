import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { RefocusSession } from '../../types/db';

interface UseRefocusRecordReturn {
  sessions: RefocusSession[];
  loading: boolean;
  error: Error | null;
}

// The couple's record of rough moments they came through. RLS scopes rows to
// members, and solo sessions to their author, so this is safe to select
// directly — but note what is NOT selected: initiator_side / partner_side never
// leave the server. The Memory tab shows the summary, never the raw vent.
export function useRefocusRecord(coupleId: string | null): UseRefocusRecordReturn {
  const [sessions, setSessions] = useState<RefocusSession[]>([]);
  const [loading, setLoading] = useState(!!coupleId);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!coupleId) {
      setSessions([]);
      setLoading(false);
      return;
    }
    let cancelled = false;

    (async () => {
      const { data, error: err } = await supabase
        .from('refocus_sessions')
        .select('id, couple_id, initiator, topic, state, summary, themes, created_at, revealed_at, is_solo')
        .eq('couple_id', coupleId)
        .in('state', ['revealed', 'expired'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (cancelled) return;
      if (err) {
        setError(new Error(err.message));
      } else {
        setSessions((data ?? []) as unknown as RefocusSession[]);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [coupleId]);

  return { sessions, loading, error };
}
