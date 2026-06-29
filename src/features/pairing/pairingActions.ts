import { supabase, Couple } from '../../lib/supabase';
import { normalizeInviteCode, isValidInviteCode } from '../../domain/inviteCode';
import { notifyPaired } from '../notifications';

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

  // @ts-expect-error supabase-js typed RPC data resolves to never; the couple row has id
  notifyPaired(data.id);

  return data;
}
