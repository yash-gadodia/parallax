import { create } from 'zustand';
import { DROP } from '../content/drop';
import { scoreReveal, PromptAnswers, RevealScore } from '../domain/reveal';

export interface PlayState {
  myPicks: (number | null)[];
  myHunches: (number | null)[];
  idx: number;
  phase: 'pick' | 'hunch';
  done: boolean;
  reset: () => void;
  setPick: (promptIdx: number, optionIdx: number | null) => void;
  setHunch: (promptIdx: number, optionIdx: number | null) => void;
}

export const usePlayStore = create<PlayState>((set) => ({
  myPicks: [null, null, null],
  myHunches: [null, null, null],
  idx: 0,
  phase: 'pick',
  done: false,

  reset: () =>
    set({
      myPicks: [null, null, null],
      myHunches: [null, null, null],
      idx: 0,
      phase: 'pick',
      done: false,
    }),

  setPick: (promptIdx: number, optionIdx: number | null) =>
    set((state) => {
      const newPicks = [...state.myPicks];
      newPicks[promptIdx] = optionIdx;
      return { myPicks: newPicks };
    }),

  setHunch: (promptIdx: number, optionIdx: number | null) =>
    set((state) => {
      const newHunches = [...state.myHunches];
      newHunches[promptIdx] = optionIdx;
      return { myHunches: newHunches };
    }),
}));

// Derived helper: maps current play state to PromptAnswers and calls scoreReveal
export function computeReveal(state: PlayState): RevealScore {
  const promptAnswers: PromptAnswers[] = DROP.prompts.map((prompt, i) => ({
    youPick: state.myPicks[i] ?? prompt.youDemo,
    youHunch: state.myHunches[i] ?? prompt.youHunchDemo,
    themPick: prompt.remy,
    themHunch: prompt.remyHunch,
  }));
  return scoreReveal(promptAnswers);
}
