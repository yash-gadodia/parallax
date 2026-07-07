import type { RepairVerdict } from '../../content/repair';

// Pure repair check-in logic (RN-free, exact-testable).

// get_repair_checkin (0044) projection.
export interface RepairCheckinState {
  exists: boolean;
  id?: string;
  state?: 'open' | 'revealed' | 'reflection';
  created_at?: string;
  revealed_at?: string | null;
  i_answered?: boolean;
  partner_answered?: boolean;
  my_verdict?: RepairVerdict | null;
  their_verdict?: RepairVerdict | null;
  reflection_mine?: boolean;
}

/** Narrow the RPC's jsonb to a renderable state. Null = not renderable. */
export function parseRepairCheckin(data: unknown): RepairCheckinState | null {
  const d = data as RepairCheckinState | null;
  if (!d || typeof d.exists !== 'boolean') return null;
  if (!d.exists) return { exists: false };
  if (typeof d.id !== 'string') return null;
  if (d.state !== 'open' && d.state !== 'revealed' && d.state !== 'reflection') return null;
  return d;
}

export type RepairOutcome = 'repair' | 'getting_there' | 'tender';

/**
 * The one verdict line of the mutual reveal: mutual "yes" is a repair;
 * either side "still tender" leads with tenderness (and offers round two);
 * everything else is getting there.
 */
export function repairOutcome(mine: RepairVerdict, theirs: RepairVerdict): RepairOutcome {
  if (mine === 'yes' && theirs === 'yes') return 'repair';
  if (mine === 'still_tender' || theirs === 'still_tender') return 'tender';
  return 'getting_there';
}

export type RepairCardView =
  | { kind: 'hidden' }
  | { kind: 'question' }
  | { kind: 'waiting' }
  | { kind: 'reveal'; outcome: RepairOutcome; mine: RepairVerdict; theirs: RepairVerdict }
  | { kind: 'reflection' };

/**
 * The card's state machine (V2_PLAN §10): question → waiting → gated reveal;
 * 48h one-sided → in-place reflection transform (only for the partner who
 * answered); dismissed reveals and saved reflections leave quietly.
 */
export function repairCardView(args: {
  flagOn: boolean;
  isLive: boolean;
  checkin: RepairCheckinState | null;
  revealSeen: boolean;
  reflectionSaved: boolean;
}): RepairCardView {
  const { flagOn, isLive, checkin, revealSeen, reflectionSaved } = args;
  if (!flagOn || !isLive || !checkin || !checkin.exists) return { kind: 'hidden' };

  if (checkin.state === 'open') {
    return checkin.i_answered ? { kind: 'waiting' } : { kind: 'question' };
  }

  if (checkin.state === 'revealed') {
    if (revealSeen) return { kind: 'hidden' };
    if (!checkin.my_verdict || !checkin.their_verdict) return { kind: 'hidden' };
    return {
      kind: 'reveal',
      outcome: repairOutcome(checkin.my_verdict, checkin.their_verdict),
      mine: checkin.my_verdict,
      theirs: checkin.their_verdict,
    };
  }

  // reflection: only the partner who answered writes the note; the partner
  // who never engaged sees nothing (no follow-up nag, §10).
  if (checkin.state === 'reflection') {
    if (!checkin.reflection_mine || reflectionSaved) return { kind: 'hidden' };
    return { kind: 'reflection' };
  }

  return { kind: 'hidden' };
}
