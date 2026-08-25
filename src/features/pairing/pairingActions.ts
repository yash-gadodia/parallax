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

// create_couple hard-errors if the caller already belongs to a pending/active
// couple, which any remount of the pair-up step triggers (the first mount
// already created one). Reuse that row instead of dead-ending on a retry loop.
export async function ensureInviteCouple(): Promise<Couple> {
  try {
    return await createCouple();
  } catch (err) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw err;

    const { data } = await supabase
      .from('couples')
      .select('*')
      .or(`member_a.eq.${user.id},member_b.eq.${user.id}`)
      .neq('status', 'dissolved')
      .order('status', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) throw err;
    return data as Couple;
  }
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
