import { supabase } from '../../lib/supabase';
import { PromptAnswers, scoreReveal } from '../../domain/reveal';
import { useUiStore } from '../../store/ui';
import { persistDropLearning } from './dropLearning';
import { notifyPartner } from '../notifications';
import type { CoupleDrop, Answer, DropPrompt, Couple, Json, TodayState } from '../../types/db';

/**
 * Ensure today's couple_drop exists and return its UUID.
 * Safe to call multiple times (idempotent).
 */
export async function ensureTodayDrop(coupleId: string): Promise<string> {
  try {
    // @ts-expect-error supabase-js RPC overload limitation with multiple function signatures
    const { data, error } = await supabase.rpc('ensure_today_drop', {
      p_couple: coupleId,
    });

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('ensure_today_drop returned no data');
    }

    return data;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to ensure today drop';
    useUiStore.getState().fireToast(`Error: ${msg}`);
    throw err;
  }
}

interface AnswerPayload {
  prompt_id: string;
  pick: number | null;
  hunch: number | null;
}

export interface SubmitResult {
  coupleDropId: string;
  state: 'open' | 'one_done' | 'revealed';
  wavePct: number | null;
}

/**
 * Submit the user's answers (picks and hunches) for a couple_drop.
 * The server (submit_answers, migration 0014) owns the state flip: when the
 * second partner submits it stores wave_pct and increments the couple streak.
 * The client never simulates the partner and never drives the streak.
 */
export async function submitMyAnswers(
  coupleId: string,
  picks: (number | null)[],
  hunches: (number | null)[]
): Promise<SubmitResult> {
  try {
    // First, ensure today's drop exists
    const coupleDropId = await ensureTodayDrop(coupleId);

    // Fetch the prompts of THIS drop (not the whole catalog), in order
    const { data: coupleDrop, error: cdError } = await supabase
      .from('couple_drops')
      .select('drop_id')
      .eq('id', coupleDropId)
      .maybeSingle();

    if (cdError) {
      throw cdError;
    }
    const dropId = (coupleDrop as { drop_id: string } | null)?.drop_id;
    if (!dropId) {
      throw new Error('Couple drop not found');
    }

    const { data: prompts, error: promptError } = await supabase
      .from('drop_prompts')
      .select('id')
      .eq('drop_id', dropId)
      .order('position', { ascending: true });

    if (promptError) {
      throw promptError;
    }

    const promptList = (prompts || []) as Array<{ id: string }>;
    if (promptList.length === 0) {
      throw new Error('No prompts found');
    }

    // Construct answer payloads from picks, hunches, and prompt IDs
    const answers: AnswerPayload[] = promptList.map((prompt, i) => ({
      prompt_id: prompt.id,
      pick: picks[i] ?? null,
      hunch: hunches[i] ?? null,
    }));

    // Submit the user's answers — the server computes the new state
    // @ts-expect-error supabase-js RPC overload limitation with multiple function signatures
    const { data: submitData, error: submitError } = await supabase.rpc('submit_answers', {
      p_couple_drop: coupleDropId,
      p_answers: answers,
    });

    if (submitError) {
      throw submitError;
    }

    const result = (submitData ?? {}) as {
      new_state?: 'open' | 'one_done' | 'revealed';
      wave_pct?: number | null;
    };
    const newState = result.new_state ?? 'one_done';

    // Partner notifications (no-op without a real session inside notifyPartner).
    const { data: sessionData } = await supabase.auth.getUser();
    const hasSession = !!sessionData?.user?.id;
    if (hasSession) {
      if (newState === 'revealed') {
        // We were the second submitter — the reveal is ready for both.
        notifyPartner(coupleDropId, 'revealed'); // fire-and-forget
      } else {
        notifyPartner(coupleDropId, 'played'); // fire-and-forget
      }
    }

    return {
      coupleDropId,
      state: newState,
      wavePct: result.wave_pct ?? null,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to submit answers';
    useUiStore.getState().fireToast(`Error: ${msg}`);
    throw err;
  }
}

export interface DropContent {
  code: string | null;
  title: string | null;
  prompts: Array<{ id: string; emoji: string; q: string; opts: string[] }>;
}

/**
 * Fetch the actual content (code, title, prompts) assigned to a couple_drop,
 * shaped like the static DROP so screens can render either interchangeably.
 * Returns null on any failure — callers fall back to a neutral state.
 */
export async function getDropContent(coupleDropId: string): Promise<DropContent | null> {
  const { data: coupleDrop, error: cdError } = await supabase
    .from('couple_drops')
    .select('drop_id')
    .eq('id', coupleDropId)
    .maybeSingle();

  if (cdError || !coupleDrop) return null;
  const dropId = (coupleDrop as { drop_id: string }).drop_id;

  const [dropRes, promptsRes] = await Promise.all([
    supabase.from('drops').select('code, title').eq('id', dropId).maybeSingle(),
    supabase
      .from('drop_prompts')
      .select('id, emoji, question, options')
      .eq('drop_id', dropId)
      .order('position', { ascending: true }),
  ]);

  if (promptsRes.error) return null;
  const promptRows = (promptsRes.data || []) as Array<{
    id: string;
    emoji: string | null;
    question: string | null;
    options: string[];
  }>;
  if (promptRows.length === 0) return null;

  const dropMeta = (dropRes.data ?? {}) as { code?: string | null; title?: string | null };

  return {
    code: dropMeta.code ?? null,
    title: dropMeta.title ?? null,
    prompts: promptRows.map((p) => ({
      id: p.id,
      emoji: p.emoji ?? '💬',
      q: p.question ?? '',
      opts: p.options,
    })),
  };
}

/**
 * Fetch today's truthful state for the couple in one round-trip.
 * RLS (correctly) hides the partner's answers pre-reveal, so partner_answered
 * can only be known via this SECURITY DEFINER RPC — never inferred client-side.
 */
export async function getTodayState(coupleId: string): Promise<TodayState | null> {
  // @ts-expect-error supabase-js RPC overload limitation with multiple function signatures
  const { data, error } = await supabase.rpc('get_today_state', {
    p_couple: coupleId,
  });

  if (error) {
    // Quiet failure by design: callers render the neutral not-done state
    // rather than a fabricated one. No toast — this runs on every focus.
    return null;
  }

  return (data ?? null) as TodayState | null;
}

/**
 * Fetch the reveal data for a couple_drop.
 * Returns the full RevealScore by mapping answer pairs.
 */
export async function fetchReveal(coupleDropId: string) {
  try {
    // Read couple_drop metadata
    const { data: coupleDrop, error: dropError } = await supabase
      .from('couple_drops')
      .select('id, couple_id, state, drop_id, wave_pct')
      .eq('id', coupleDropId)
      .maybeSingle();

    if (dropError) {
      throw dropError;
    }

    type CoupleDropRow = { id: string; couple_id: string; state: 'open' | 'one_done' | 'revealed'; drop_id: string; wave_pct: number | null };
    const drop = coupleDrop as CoupleDropRow | null;
    if (!drop) {
      throw new Error('Couple drop not found');
    }

    // Fetch prompts for this drop
    const { data: prompts, error: promptError } = await supabase
      .from('drop_prompts')
      .select('id, position, emoji, question, options')
      .eq('drop_id', drop.drop_id)
      .order('position', { ascending: true });

    if (promptError) {
      throw promptError;
    }

    // Fetch all answers for this couple_drop
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('prompt_id, author, pick, hunch')
      .eq('couple_drop_id', coupleDropId);

    if (answersError) {
      throw answersError;
    }

    // Identify the current user so "you" vs "them" is correct whether the caller
    // is member_a or member_b (do NOT assume the caller is member_a).
    const { data: userData } = await supabase.auth.getUser();
    const myId = userData?.user?.id ?? null;

    // Build maps for quick lookup: prompt_id -> answer
    const myAnswers = new Map<string, { pick: number | null; hunch: number | null }>();
    const themAnswers = new Map<string, { pick: number | null; hunch: number | null }>();

    const answerList = (answers || []) as Array<{ prompt_id: string; author: string; pick: number | null; hunch: number | null }>;

    let themId: string | null = null;
    for (const ans of answerList) {
      const ansObj = { pick: ans.pick, hunch: ans.hunch };
      if (ans.author === myId) {
        myAnswers.set(ans.prompt_id, ansObj);
      } else {
        themAnswers.set(ans.prompt_id, ansObj);
        themId = ans.author;
      }
    }

    // Map to PromptAnswers and call scoreReveal
    type FullPrompt = { id: string; emoji: string | null; question: string | null; options: string[] };
    const promptList = (prompts || []) as Array<FullPrompt>;
    const promptAnswers: PromptAnswers[] = promptList.map((prompt) => ({
      youPick: myAnswers.get(prompt.id)?.pick ?? -1,
      youHunch: myAnswers.get(prompt.id)?.hunch ?? -1,
      themPick: themAnswers.get(prompt.id)?.pick ?? -1,
      themHunch: themAnswers.get(prompt.id)?.hunch ?? -1,
    }));

    const reveal = scoreReveal(promptAnswers);

    // Persist a 'drop' learning from this reveal when we have a real partner.
    // Non-blocking — errors are swallowed inside persistDropLearning.
    if (myId && themId) {
      const pairs = promptList.map((p) => ({
        youHunch: myAnswers.get(p.id)?.hunch ?? -1,
        themPick: themAnswers.get(p.id)?.pick ?? -1,
      }));
      persistDropLearning({
        coupleId: drop.couple_id,
        aboutId: themId,
        coupleDropId,
        prompts: promptList,
        pairs,
      });
    }

    return {
      state: drop.state,
      // The server-stored wavelength is authoritative when present (0014);
      // the client-scored detail breakdown still drives the per-prompt UI.
      reveal: drop.wave_pct != null ? { ...reveal, wave: drop.wave_pct } : reveal,
      promptAnswers,
      prompts: promptList,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch reveal';
    useUiStore.getState().fireToast(`Error: ${msg}`);
    throw err;
  }
}
