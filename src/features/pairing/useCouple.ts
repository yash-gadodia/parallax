import { useEffect, useState } from 'react';
import { supabase, Couple } from '../../lib/supabase';
import { PostgrestMaybeSingleResponse } from '@supabase/supabase-js';

// supabase.channel(topic) DEDUPES by topic — a second caller gets back the
// already-subscribed channel, and .on() on it throws. Several screens (the
// mounted tabs, the root guard) subscribe at once, so each instance needs a
// unique topic. This counter guarantees that.
let coupleChannelSeq = 0;

interface UseCoupleReturn {
  couple: Couple | null;
  loading: boolean;
  status: 'none' | 'pending' | 'active' | 'dissolved';
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

      // A user can transiently hold more than one row (e.g. an orphan pending
      // couple left behind before joining a partner's) — prefer the active
      // one, never let a stray row error the whole lookup via maybeSingle.
      const result: PostgrestMaybeSingleResponse<Couple> = await supabase
        .from('couples')
        .select('*')
        .or(`member_a.eq.${uid},member_b.eq.${uid}`)
        .neq('status', 'dissolved')
        .order('status', { ascending: true }) // 'active' < 'pending'
        .order('created_at', { ascending: false })
        .limit(1)
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
        channel = supabase.channel(`couple-${data.id}-${++coupleChannelSeq}`).on(
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

  const status: 'none' | 'pending' | 'active' | 'dissolved' = couple
    ? couple.status
    : 'none';

  return { couple, loading, status };
}
