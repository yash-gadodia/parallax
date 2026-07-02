import { supabase } from '../../lib/supabase';
import { useUiStore } from '../../store/ui';
import { notifyNudge } from '../notifications';

// nudge_partner raises this message when the couple already nudged today
// (1/couple/couple-local-day, enforced in 0016_nudge_push.sql).
const NUDGE_RATE_LIMITED = 'nudge_rate_limited';

/**
 * Send a nudge to partner for a couple.
 * On success, fires a push to the partner via notify-partner (fire-and-forget).
 */
export async function nudge(coupleId: string): Promise<void> {
  try {
    // @ts-expect-error supabase-js RPC overload limitation
    const { error } = await supabase.rpc('nudge_partner', {
      p_couple: coupleId,
    });

    if (error) {
      throw error;
    }

    notifyNudge(coupleId); // fire-and-forget; no-op without a session

    useUiStore.getState().fireToast('Nudge sent 👋');
  } catch (err) {
    const msg =
      (err as { message?: string } | null)?.message ?? 'Failed to send nudge';
    if (msg.includes(NUDGE_RATE_LIMITED)) {
      useUiStore
        .getState()
        .fireToast('already nudged today — give them a beat');
    } else {
      useUiStore.getState().fireToast(`Error: ${msg}`);
    }
    throw err;
  }
}

/**
 * Complete a drop reveal and increment streak.
 * Call this when couple_drop state transitions to 'revealed'.
 */
export async function completeDrop(coupleDropId: string): Promise<void> {
  try {
    // @ts-expect-error supabase-js RPC overload limitation
    const { error } = await supabase.rpc('complete_streak', {
      p_couple_drop: coupleDropId,
    });

    if (error) {
      throw error;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to complete drop';
    useUiStore.getState().fireToast(`Error: ${msg}`);
    throw err;
  }
}
