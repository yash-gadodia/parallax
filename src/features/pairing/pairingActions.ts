import { supabase, Couple } from '../../lib/supabase';
import { normalizeInviteCode, isValidInviteCode } from '../../domain/inviteCode';

export async function createCouple(): Promise<Couple> {
  const { data, error } = await (supabase.rpc as any)('create_couple');

  if (error) {
    throw error;
  }

  return data as Couple;
}

export async function joinCouple(input: string): Promise<Couple> {
  const code = normalizeInviteCode(input);

  if (!isValidInviteCode(code)) {
    throw new Error(`Invalid invite code format: "${code}"`);
  }

  const { data, error } = await (supabase.rpc as any)('join_couple', {
    p_code: code,
  });

  if (error) {
    throw error;
  }

  return data as Couple;
}
