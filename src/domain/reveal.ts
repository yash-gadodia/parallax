export interface PromptAnswers { youPick: number; youHunch: number; themPick: number; themHunch: number; }
export interface RevealScore { yourHits: number; theirHits: number; twins: number; wave: number; }

export function scoreReveal(prompts: PromptAnswers[]): RevealScore {
  let yourHits = 0, theirHits = 0, twins = 0;
  for (const p of prompts) {
    if (p.youHunch === p.themPick) yourHits++;
    if (p.themHunch === p.youPick) theirHits++;
    if (p.youPick === p.themPick) twins++;
  }
  const wave = prompts.length ? Math.round(((yourHits + theirHits) / (prompts.length * 2)) * 100) : 0;
  return { yourHits, theirHits, twins, wave };
}

/**
 * Longest run of consecutive prompts where BOTH hunches landed — the couple
 * reading each other back to back. 3+ is the "3 hunches in a row 🔥" moment
 * (IMPROVEMENT_PLAN 1.5): rare, mutual, earned.
 */
export function mutualReadRun(prompts: PromptAnswers[]): number {
  let best = 0, run = 0;
  for (const p of prompts) {
    if (p.youHunch === p.themPick && p.themHunch === p.youPick) {
      run++;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  return best;
}

/**
 * The prompt whose miss carries tonight's conversation (IMPROVEMENT_PLAN 1.5):
 * prefer the first prompt where BOTH hunches missed, else the first one-sided
 * miss, else null (a perfect round has nothing to unpack).
 */
export function biggestMissIndex(prompts: PromptAnswers[]): number | null {
  let oneSided: number | null = null;
  for (let i = 0; i < prompts.length; i++) {
    const youMissed = prompts[i].youHunch !== prompts[i].themPick;
    const themMissed = prompts[i].themHunch !== prompts[i].youPick;
    if (youMissed && themMissed) return i;
    if (oneSided === null && (youMissed || themMissed)) oneSided = i;
  }
  return oneSided;
}
