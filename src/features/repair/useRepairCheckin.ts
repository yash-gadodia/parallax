import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { useUiStore } from '../../store/ui';
import { track, EVENTS } from '../../lib/analytics';
import type { RepairVerdict } from '../../content/repair';
import { parseRepairCheckin } from './repairLogic';
import type { RepairCheckinState } from './repairLogic';

// Device-local dedup for moments the server intentionally keeps live:
// a viewed reveal and a saved reflection both leave Today quietly.
const REVEAL_SEEN_KEY = 'parallax:repair_reveal_seen';
const REFLECTION_SAVED_KEY = 'parallax:repair_reflection_saved';

/**
 * The couple's active repair check-in (V2 F2). On mount it runs the
 * ensure sweep (creates the check-in if one became due — 0044) and reads the
 * safe projection. All verdict gating is server-side; this hook only carries
 * the projection plus the local seen/saved bookkeeping.
 */
export function useRepairCheckin(coupleId: string | null) {
  const [loading, setLoading] = useState(!!coupleId);
  const [checkin, setCheckin] = useState<RepairCheckinState | null>(null);
  const [revealSeen, setRevealSeen] = useState(false);
  const [reflectionSaved, setReflectionSaved] = useState(false);

  const refresh = useCallback(async () => {
    if (!coupleId) return;
    try {
      // @ts-expect-error supabase-js typed rpc args resolve to never (database.md)
      const { data, error } = await supabase.rpc('get_repair_checkin', {
        p_couple: coupleId,
      });
      if (error) return;
      const parsed = parseRepairCheckin(data);
      setCheckin(parsed);
      if (parsed?.id) {
        const [seen, saved] = await Promise.all([
          AsyncStorage.getItem(REVEAL_SEEN_KEY),
          AsyncStorage.getItem(REFLECTION_SAVED_KEY),
        ]);
        setRevealSeen(seen === parsed.id);
        setReflectionSaved(saved === parsed.id);
      }
    } catch {
      // offline — the card simply doesn't render this session
    }
  }, [coupleId]);

  useEffect(() => {
    if (!coupleId) {
      setCheckin(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        // @ts-expect-error supabase-js typed rpc args resolve to never (database.md)
        await supabase.rpc('ensure_repair_checkin', { p_couple: coupleId });
      } catch {
        // sweep failure is fine — an existing check-in still renders
      }
      if (!cancelled) await refresh();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [coupleId, refresh]);

  const submit = useCallback(
    async (verdict: RepairVerdict) => {
      if (!checkin?.id) return;
      // @ts-expect-error supabase-js typed rpc args resolve to never (database.md)
      const { error } = await supabase.rpc('submit_repair_verdict', {
        p_checkin: checkin.id,
        p_verdict: verdict,
      });
      if (error) {
        useUiStore.getState().fireToast("that didn't save — try again");
        return;
      }
      track(EVENTS.REPAIR_VERDICT, { verdict });
      await refresh();
    },
    [checkin?.id, refresh]
  );

  const markRevealSeen = useCallback(() => {
    if (!checkin?.id) return;
    setRevealSeen(true);
    AsyncStorage.setItem(REVEAL_SEEN_KEY, checkin.id).catch(() => {});
  }, [checkin?.id]);

  const saveReflection = useCallback(
    async (text: string): Promise<boolean> => {
      if (!coupleId || !checkin?.id || !text.trim()) return false;
      // @ts-expect-error supabase-js typed rpc args resolve to never (database.md)
      const { error } = await supabase.rpc('add_private_learning', {
        p_couple: coupleId,
        p_learning_detail: text.trim(),
      });
      if (error) {
        useUiStore.getState().fireToast("that didn't save — try again");
        return false;
      }
      setReflectionSaved(true);
      AsyncStorage.setItem(REFLECTION_SAVED_KEY, checkin.id).catch(() => {});
      return true;
    },
    [coupleId, checkin?.id]
  );

  return {
    loading,
    checkin,
    revealSeen,
    reflectionSaved,
    submit,
    markRevealSeen,
    saveReflection,
    refresh,
  };
}
