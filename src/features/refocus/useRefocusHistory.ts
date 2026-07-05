import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { RefocusSession } from '../../types/db';

/**
 * Fetch all refocus_sessions for a couple, ordered by most recent first.
 * Used to check if they qualify for the escalation card (3+ in 30 days).
 */
export function useRefocusHistory(coupleId: string | null) {
  const [sessions, setSessions] = useState<RefocusSession[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!coupleId) {
      setSessions([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('refocus_sessions')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions((data as RefocusSession[]) ?? []);
    } catch (err) {
      console.error('Failed to fetch refocus history:', err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [coupleId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { sessions, loading };
}
