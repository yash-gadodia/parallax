import { create } from 'zustand';

interface OnboardingState {
  pendingIntents: string[];
  setPendingIntents: (intents: string[]) => void;
  clearPendingIntents: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  pendingIntents: [],
  setPendingIntents: (intents) => set({ pendingIntents: intents }),
  clearPendingIntents: () => set({ pendingIntents: [] }),
}));
