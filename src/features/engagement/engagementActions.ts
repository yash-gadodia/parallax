import { supabase } from '../../lib/supabase';
import { useUiStore } from '../../store/ui';

/**
 * Send a nudge to partner for a couple.
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

    useUiStore.getState().fireToast('Nudge sent 👋');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to send nudge';
    useUiStore.getState().fireToast(`Error: ${msg}`);
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
