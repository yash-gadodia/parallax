import { create } from 'zustand';

interface UiState {
  toast: string | null;
  sheet: string | null;
  fireToast: (msg: string) => void;
  openSheet: (name: string) => void;
  closeSheet: () => void;
}

let toastTimer: NodeJS.Timeout | null = null;

export const useUiStore = create<UiState>((set) => ({
  toast: null,
  sheet: null,

  fireToast: (msg: string) => {
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    set({ toast: msg });
    toastTimer = setTimeout(() => {
      set({ toast: null });
      toastTimer = null;
    }, 1900);
  },

  openSheet: (name: string) => {
    set({ sheet: name });
  },

  closeSheet: () => {
    set({ sheet: null });
  },
}));
