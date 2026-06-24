import { create } from 'zustand';

interface OnboardingState {
  pendingIntents: string[];
  setPendingIntents: (intents: string[]) => void;
  clearPendingIntents: () => void;
  pendingInviteCode: string | null;
  setPendingInviteCode: (code: string | null) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  pendingIntents: [],
  setPendingIntents: (intents) => set({ pendingIntents: intents }),
  clearPendingIntents: () => set({ pendingIntents: [] }),
  pendingInviteCode: null,
  setPendingInviteCode: (code) => set({ pendingInviteCode: code }),
}));
