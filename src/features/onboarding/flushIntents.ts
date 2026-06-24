import { supabase } from '../../lib/supabase';
import { useOnboardingStore } from '../../store/onboarding';

export async function flushPendingIntents(uid: string): Promise<void> {
  const { pendingIntents, clearPendingIntents } = useOnboardingStore.getState();
  if (!pendingIntents.length) return;

  // @ts-expect-error supabase-js typed update arg resolves to never for this table
  const { error } = await supabase.from('profiles').update({ intents: pendingIntents }).eq('id', uid);

  if (!error) {
    clearPendingIntents();
  }
}
