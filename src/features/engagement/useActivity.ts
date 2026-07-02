import { useEffect, useState } from 'react';
import { supabase, Activity } from '../../lib/supabase';

// supabase.channel(topic) dedupes by topic; a unique suffix per subscriber keeps
// two simultaneous mounts (Today's bell + the Activity screen) from sharing one
// channel and throwing "cannot add callbacks after subscribe()".
let activityChannelSeq = 0;

interface UseActivityReturn {
  items: Activity[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  markAllRead: () => Promise<void>;
}

export function useActivity(coupleId: string | null): UseActivityReturn {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!coupleId) {
      setLoading(false);
      return;
    }

    // cancelled bails the in-flight fetch on unmount (incl. React's dev
    // double-mount) before it subscribes, so we never leak a second channel.
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetchActivity = async () => {
      try {
        const { data, error } = await supabase
          .from('activity')
          .select('*')
          .eq('couple_id', coupleId)
          .order('created_at', { ascending: false });

        if (cancelled) return;

        if (error) {
          throw error;
        }

        setItems((data || []) as Activity[]);
        setError(null);
        setLoading(false);

        channel = supabase
          .channel(`activity-${coupleId}-${++activityChannelSeq}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'activity',
              filter: `couple_id=eq.${coupleId}`,
            },
            payload => {
              if (payload.new) {
                setItems(prev => [payload.new as Activity, ...prev]);
              }
            }
          )
          .subscribe();
      } catch (err) {
        if (cancelled) return;
        // No toast here — the Activity screen renders an honest in-place
        // error state; passive consumers (Today's bell) fail quietly.
        setError(err instanceof Error ? err : new Error('Failed to fetch activity'));
        setLoading(false);
      }
    };

    fetchActivity();

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [coupleId, reloadKey]);

  const unreadCount = items.filter(a => {
    return userId && a.read_by && !a.read_by.includes(userId);
  }).length;

  const markAllRead = async () => {
    if (!coupleId) return;

    try {
      // @ts-expect-error supabase-js RPC overload limitation
      const { error } = await supabase.rpc('mark_activity_read', {
        p_couple: coupleId,
      });

      if (error) {
        throw error;
      }

      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;

      if (uid) {
        setItems(prev =>
          prev.map(item => ({
            ...item,
            read_by: item.read_by?.includes(uid)
              ? item.read_by
              : [...(item.read_by || []), uid],
          }))
        );
      }
    } catch (err) {
      // Rethrow: the manual mark-read button shows its own warm toast; the
      // background auto-read swallows it silently. The hook never toasts.
      throw err instanceof Error ? err : new Error('Failed to mark activity read');
    }
  };

  // Retry after a failed fetch: clears the error, re-enters loading, re-runs
  // the effect (which also re-subscribes the realtime channel).
  const refetch = () => {
    setError(null);
    setLoading(true);
    setReloadKey(k => k + 1);
  };

  return {
    items,
    unreadCount,
    loading,
    error,
    refetch,
    markAllRead,
  };
}
