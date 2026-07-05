import { supabase, Couple } from '../../lib/supabase';
import { normalizeInviteCode, isValidInviteCode } from '../../domain/inviteCode';
import { notifyPaired } from '../notifications';
import { track, EVENTS } from '../../lib/analytics';

export async function unpairCouple(coupleId: string): Promise<void> {
  // @ts-expect-error supabase-js typed RPC resolves to never for void-returning functions
  const { error } = await supabase.rpc('unpair', { p_couple: coupleId });
  if (error) {
    throw error;
  }
}

export async function createCouple(): Promise<Couple> {
  const { data, error } = await supabase.rpc('create_couple');

  if (error) {
    throw error;
  }

  // 2.5 funnel: a couple now EXISTS (partner still pending) — distinct from
  // COUPLE_PAIRED, which fires when the partner actually joins.
  track(EVENTS.COUPLE_CREATED);

  return data;
}

export async function joinCouple(input: string): Promise<Couple> {
  const code = normalizeInviteCode(input);

  if (!isValidInviteCode(code)) {
    throw new Error(`Invalid invite code format: "${code}"`);
  }

  // @ts-expect-error supabase-js RPC overload limitation with multiple function signatures
  const { data, error } = await supabase.rpc('join_couple', {
    p_code: code,
  });

  if (error) {
    throw error;
  }

  // D0 funnel: partner joining the couple
  track(EVENTS.PARTNER_JOINED);

  // @ts-expect-error supabase-js typed RPC data resolves to never; the couple row has id
  notifyPaired(data.id);

  return data;
}
