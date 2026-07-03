import { supabase } from '../../lib/supabase';
import type { MoneyDateState } from '../../types/db';

// All writes go through the 0029 SECURITY DEFINER RPCs — membership guards,
// resume/abandon rules and length limits live server-side. These wrappers
// throw on error; screens own the honest error states.

/** Open (or resume, < 24h) the couple's money date. Returns the session id. */
export async function startMoneyDate(coupleId: string): Promise<string> {
  // @ts-expect-error supabase-js RPC overload limitation with multiple function signatures
  const { data, error } = await supabase.rpc('start_money_date', {
    p_couple: coupleId,
  });
  if (error) throw error;
  return data as string;
}

/**
 * Record the current card's optional shared note and move on.
 * Returns the new step.
 */
export async function advanceMoneyDate(
  sessionId: string,
  note: string | null
): Promise<number> {
  // @ts-expect-error supabase-js RPC overload limitation with multiple function signatures
  const { data, error } = await supabase.rpc('advance_money_date', {
    p_session: sessionId,
    p_note: note,
  });
  if (error) throw error;
  return data as number;
}

/** Finish the session with the one tiny agreed action (required, <= 280). */
export async function completeMoneyDate(
  sessionId: string,
  action: string
): Promise<void> {
  // @ts-expect-error supabase-js RPC overload limitation with multiple function signatures
  const { error } = await supabase.rpc('complete_money_date', {
    p_session: sessionId,
    p_action: action,
  });
  if (error) throw error;
}

function isOpenShape(v: unknown): v is { id: string; step: number; started_by: string } {
  const o = v as { id?: unknown; step?: unknown } | null;
  return !!o && typeof o.id === 'string' && typeof o.step === 'number';
}

/** Narrow the get_money_date_state jsonb to a typed state. Null = unusable. */
export function parseMoneyDateState(data: unknown): MoneyDateState | null {
  const raw = data as {
    open?: unknown;
    last_completed_at?: unknown;
    last_agreed_action?: unknown;
    sessions_completed?: unknown;
  } | null;
  if (!raw || typeof raw !== 'object') return null;
  return {
    open: isOpenShape(raw.open) ? raw.open : null,
    last_completed_at:
      typeof raw.last_completed_at === 'string' ? raw.last_completed_at : null,
    last_agreed_action:
      typeof raw.last_agreed_action === 'string' ? raw.last_agreed_action : null,
    sessions_completed:
      typeof raw.sessions_completed === 'number' ? raw.sessions_completed : 0,
  };
}

/** The couple's money-date surface (open session + last completed) in one call. */
export async function fetchMoneyDateState(coupleId: string): Promise<MoneyDateState> {
  // @ts-expect-error supabase-js RPC overload limitation with multiple function signatures
  const { data, error } = await supabase.rpc('get_money_date_state', {
    p_couple: coupleId,
  });
  if (error) throw error;
  const parsed = parseMoneyDateState(data);
  if (!parsed) throw new Error('money_date_state_unreadable');
  return parsed;
}
