import { supabase } from '../../lib/supabase';
import type { JourneyState } from '../../types/db';

// All journey writes go through the 0028 SECURITY DEFINER RPCs — never raw
// table writes. Errors are thrown for the caller to surface honestly.

/** Enroll the couple in a journey. Idempotent server-side. */
export async function enrollJourney(coupleId: string, journeyId: string): Promise<string> {
  const { data, error } = await supabase.rpc(
    'enroll_journey' as never,
    { p_couple: coupleId, p_journey: journeyId } as never
  );
  if (error) throw error;
  return data as unknown as string;
}

/** Fetch the couple's journey surface (get_journey_state). */
export async function getJourneyState(coupleId: string): Promise<JourneyState> {
  const { data, error } = await supabase.rpc(
    'get_journey_state' as never,
    { p_couple: coupleId } as never
  );
  if (error) throw error;
  return data as unknown as JourneyState;
}

/** Record my check-in on the current stage (upsert; note optional). */
export async function recordJourneyCheckin(
  coupleJourneyId: string,
  note: string | null
): Promise<void> {
  const { error } = await supabase.rpc(
    'record_journey_checkin' as never,
    { p_couple_journey: coupleJourneyId, p_note: note } as never
  );
  if (error) throw error;
}

/**
 * Advance to the next stage. The server gates this on a recorded check-in —
 * the client mirrors the gate (canAdvance) but never enforces it.
 */
export async function advanceJourneyStage(
  coupleJourneyId: string
): Promise<{ current_stage: number; completed: boolean }> {
  const { data, error } = await supabase.rpc(
    'advance_journey_stage' as never,
    { p_couple_journey: coupleJourneyId } as never
  );
  if (error) throw error;
  return data as unknown as { current_stage: number; completed: boolean };
}
