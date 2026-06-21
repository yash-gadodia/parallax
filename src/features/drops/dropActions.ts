import { supabase } from '../../lib/supabase';
import { PromptAnswers, scoreReveal } from '../../domain/reveal';
import { useUiStore } from '../../store/ui';
import type { CoupleDrop, Answer, DropPrompt, Couple, Json } from '../../types/db';

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

/**
 * Submit the user's answers (picks and hunches) for a couple_drop.
 * Then auto-submit a demo partner (sim_partner_submit) so state flips to 'revealed'.
 */
export async function submitMyAnswers(
  coupleId: string,
  picks: (number | null)[],
  hunches: (number | null)[]
): Promise<void> {
  try {
    // First, ensure today's drop exists
    const coupleDropId = await ensureTodayDrop(coupleId);

    // Fetch the prompts to get prompt IDs in correct order
    const { data: prompts, error: promptError } = await supabase
      .from('drop_prompts')
      .select('id')
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

    // Then, submit the user's answers
    // @ts-expect-error supabase-js RPC overload limitation with multiple function signatures
    const { error: submitError } = await supabase.rpc('submit_answers', {
      p_couple_drop: coupleDropId,
      p_answers: answers,
    });

    if (submitError) {
      throw submitError;
    }

    // Finally, auto-submit demo partner to flip state to 'revealed'
    // @ts-expect-error supabase-js RPC overload limitation with multiple function signatures
    const { error: simError } = await supabase.rpc('sim_partner_submit', {
      p_couple_drop: coupleDropId,
    });

    if (simError) {
      throw simError;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to submit answers';
    useUiStore.getState().fireToast(`Error: ${msg}`);
    throw err;
  }
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
      .select('id, couple_id, state, drop_id')
      .eq('id', coupleDropId)
      .maybeSingle();

    if (dropError) {
      throw dropError;
    }

    type CoupleDropRow = { id: string; couple_id: string; state: 'open' | 'one_done' | 'revealed'; drop_id: string };
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

    // Get couple to map members to authors
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('member_a, member_b')
      .eq('id', drop.couple_id)
      .maybeSingle();

    if (coupleError) {
      throw coupleError;
    }

    // Build maps for quick lookup: prompt_id -> answer
    const myAnswers = new Map<string, { pick: number | null; hunch: number | null }>();
    const themAnswers = new Map<string, { pick: number | null; hunch: number | null }>();

    const answerList = (answers || []) as Array<{ prompt_id: string; author: string; pick: number | null; hunch: number | null }>;
    const coupleData = couple as { member_a: string; member_b: string | null } | null;

    if (coupleData) {
      for (const ans of answerList) {
        const ansObj = { pick: ans.pick, hunch: ans.hunch };
        if (ans.author === coupleData.member_a) {
          myAnswers.set(ans.prompt_id, ansObj);
        } else {
          themAnswers.set(ans.prompt_id, ansObj);
        }
      }
    }

    // Map to PromptAnswers and call scoreReveal
    const promptList = (prompts || []) as Array<{ id: string }>;
    const promptAnswers: PromptAnswers[] = promptList.map((prompt) => ({
      youPick: myAnswers.get(prompt.id)?.pick ?? -1,
      youHunch: myAnswers.get(prompt.id)?.hunch ?? -1,
      themPick: themAnswers.get(prompt.id)?.pick ?? -1,
      themHunch: themAnswers.get(prompt.id)?.hunch ?? -1,
    }));

    const reveal = scoreReveal(promptAnswers);

    return {
      state: drop.state,
      reveal,
      promptAnswers,
      prompts: promptList,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch reveal';
    useUiStore.getState().fireToast(`Error: ${msg}`);
    throw err;
  }
}
