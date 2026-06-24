import { addLearning } from '../lovemap/addLearning';

interface PromptMeta {
  id: string;
  emoji: string | null;
  question: string | null;
  options: string[];
}

interface AnswerPair {
  youHunch: number;
  themPick: number;
}

export interface DerivedLearning {
  emoji: string;
  need: string;
  detail: string;
}

export function deriveLearningFromReveal(
  prompts: PromptMeta[],
  pairs: AnswerPair[]
): DerivedLearning | null {
  if (!prompts.length || !pairs.length) return null;

  // Pick the most-missed prompt (myHunch !== themPick).
  // If all hit, fall back to the first prompt for a positive note.
  const missed = prompts
    .map((p, i) => ({ p, pair: pairs[i], i }))
    .filter(({ pair }) => pair && pair.youHunch !== pair.themPick);

  const target = missed.length ? missed[0] : { p: prompts[0], pair: pairs[0] };

  const emoji = target.p.emoji ?? '💡';
  const question = target.p.question ?? 'Preference';
  const pickedOption = target.p.options[target.pair.themPick] ?? String(target.pair.themPick);

  return {
    emoji,
    need: question.length > 60 ? question.slice(0, 57) + '…' : question,
    detail: pickedOption,
  };
}

export async function persistDropLearning(params: {
  coupleId: string;
  aboutId: string;
  coupleDropId: string;
  prompts: PromptMeta[];
  pairs: AnswerPair[];
}): Promise<void> {
  const { coupleId, aboutId, coupleDropId, prompts, pairs } = params;
  const derived = deriveLearningFromReveal(prompts, pairs);
  if (!derived) return;

  try {
    await addLearning({
      coupleId,
      aboutId,
      emoji: derived.emoji,
      need: derived.need,
      detail: derived.detail,
      source: 'drop',
      origin: coupleDropId,
    });
  } catch {
    // Non-blocking: a learning failure must never break the reveal flow.
  }
}
