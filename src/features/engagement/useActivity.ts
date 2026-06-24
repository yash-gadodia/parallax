import { useEffect, useState } from 'react';
import { supabase, Activity } from '../../lib/supabase';
import { useUiStore } from '../../store/ui';

// supabase.channel(topic) dedupes by topic; a unique suffix per subscriber keeps
// two simultaneous mounts (Today's bell + the Activity screen) from sharing one
// channel and throwing "cannot add callbacks after subscribe()".
let activityChannelSeq = 0;

interface UseActivityReturn {
  items: Activity[];
  unreadCount: number;
  loading: boolean;
  markAllRead: () => Promise<void>;
}

export function useActivity(coupleId: string | null): UseActivityReturn {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const fireToast = useUiStore(s => s.fireToast);

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
        const msg = err instanceof Error ? err.message : 'Failed to fetch activity';
        fireToast(`Error: ${msg}`);
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
  }, [coupleId, fireToast]);

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
      const msg = err instanceof Error ? err.message : 'Failed to mark as read';
      fireToast(`Error: ${msg}`);
    }
  };

  return {
    items,
    unreadCount,
    loading,
    markAllRead,
  };
}
