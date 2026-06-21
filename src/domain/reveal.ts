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
