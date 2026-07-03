import React from 'react';
import { render, act } from '@testing-library/react-native';
import { useRefetchOnRefocus } from './useRefetchOnRefocus';

// Capture the focus callback so the test can fire focus events like the
// navigator does: once on initial focus, again whenever the screen refocuses.
let focusCallback: (() => void) | null = null;
jest.mock('expo-router', () => ({
  useFocusEffect: (cb: () => void) => {
    focusCallback = cb;
  },
}));

function Harness({ refetch }: { refetch: () => void }) {
  useRefetchOnRefocus(refetch);
  return null;
}

describe('useRefetchOnRefocus', () => {
  beforeEach(() => {
    focusCallback = null;
  });

  it('skips the initial focus (mount fetch already covers it) and refetches on every refocus', async () => {
    const refetch = jest.fn();
    await render(<Harness refetch={refetch} />);

    // Initial focus: the screen just mounted — its data hook is fetching.
    await act(async () => {
      focusCallback?.();
    });
    expect(refetch).toHaveBeenCalledTimes(0);

    // Back from a pushed screen: refetch.
    await act(async () => {
      focusCallback?.();
    });
    expect(refetch).toHaveBeenCalledTimes(1);

    // And again on the next round-trip.
    await act(async () => {
      focusCallback?.();
    });
    expect(refetch).toHaveBeenCalledTimes(2);
  });

  it('never fires without a focus event', async () => {
    const refetch = jest.fn();
    await render(<Harness refetch={refetch} />);
    expect(refetch).not.toHaveBeenCalled();
  });
});
