import { useEffect, useState } from 'react';
import { supabase, Couple } from '../../lib/supabase';
import { PostgrestMaybeSingleResponse } from '@supabase/supabase-js';

interface UseCoupleReturn {
  couple: Couple | null;
  loading: boolean;
  status: 'none' | 'pending' | 'active';
}

export function useCouple(): UseCoupleReturn {
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // cancelled guards the async work: on unmount (incl. React's double-mount in
    // dev) the in-flight fetch bails before subscribing, so we never add a second
    // channel with the same topic (which throws "cannot add callbacks after subscribe()").
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetchCouple = async () => {
      const user = await supabase.auth.getUser();
      if (cancelled) return;
      const uid = user.data.user?.id;

      if (!uid) {
        setLoading(false);
        return;
      }

      const result: PostgrestMaybeSingleResponse<Couple> = await supabase
        .from('couples')
        .select('*')
        .or(`member_a.eq.${uid},member_b.eq.${uid}`)
        .maybeSingle();

      if (cancelled) return;

      const { data, error } = result;

      if (error) {
        console.error('Error fetching couple:', error);
        setLoading(false);
        return;
      }

      setCouple(data);
      setLoading(false);

      if (data && !cancelled) {
        channel = supabase.channel(`couple-${data.id}`).on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'couples',
            filter: `id=eq.${data.id}`,
          },
          payload => {
            if (payload.new) {
              setCouple(payload.new as Couple);
            }
          }
        );
        channel.subscribe();
      }
    };

    fetchCouple();

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const status: 'none' | 'pending' | 'active' = couple
    ? couple.status
    : 'none';

  return { couple, loading, status };
}
