import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
  pendingIntents: string[];
  setPendingIntents: (intents: string[]) => void;
  clearPendingIntents: () => void;
  pendingInviteCode: string | null;
  setPendingInviteCode: (code: string | null) => void;
}

// Persisted so intents picked before sign-up survive the quit-to-check-email
// gap; cleared once flushPendingIntents lands them in the profile.
export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      pendingIntents: [],
      setPendingIntents: (intents) => set({ pendingIntents: intents }),
      clearPendingIntents: () => set({ pendingIntents: [] }),
      pendingInviteCode: null,
      setPendingInviteCode: (code) => set({ pendingInviteCode: code }),
    }),
    {
      name: 'parallax-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ pendingIntents: state.pendingIntents }),
    }
  )
);
