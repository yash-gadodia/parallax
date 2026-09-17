import React from 'react';
import { render, fireEvent, cleanup, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import Settings from '../settings';
import { addReceipt, listReceipts } from '../../../src/features/refocus/receipts';

// Btn/Press wrap Pressable in Animated.createAnimatedComponent; pressing the
// real ones leaves state that empties a later mount in this file (same
// pollution documented in IntroStep.test.tsx).
jest.mock('../../../src/components/Btn', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');
  return function MockBtn({ children, onPress, testID }: any) {
    return React.createElement(
      Pressable,
      { onPress, testID },
      React.createElement(Text, {}, children)
    );
  };
});
jest.mock('../../../src/components/Press', () => {
  const React = require('react');
  const { Pressable } = require('react-native');
  return function MockPress({ children, onPress }: any) {
    return React.createElement(Pressable, { onPress }, children);
  };
});

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }),
}));
jest.mock('../../../src/features/purchases/usePurchases', () => ({
  usePurchases: (sel: (s: { isPro: boolean }) => unknown) => sel({ isPro: false }),
}));
jest.mock('../../../src/features/auth/authActions', () => ({
  signOut: jest.fn(() => Promise.resolve()),
}));

let alertButtons: { text: string; onPress?: () => void }[] = [];

beforeEach(async () => {
  // Spy on the Alert the component actually imports; mocking the internal
  // module path does not intercept it under jest-expo.
  jest
    .spyOn(Alert, 'alert')
    .mockImplementation((_t, _m, buttons) => {
      alertButtons = (buttons ?? []) as { text: string; onPress?: () => void }[];
    });
  await AsyncStorage.clear();
  mockPush.mockClear();
  alertButtons = [];
});

describe('Settings', () => {
  it('routes to the paywall and the profile', async () => {
    const { getByTestId } = await render(<Settings />);

    fireEvent.press(getByTestId('settings-plus'));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/(sheets)/plus'));

    fireEvent.press(getByTestId('settings-profile'));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/editProfile'));
  });

  it('notifications are off by default; the app never nags', async () => {
    const { getByTestId } = await render(<Settings />);
    expect(getByTestId('settings-notifications').props.value).toBe(false);
  });

  // "Delete everything" has to mean it, and it must ask exactly once.
  it('delete everything confirms, then really empties the store', async () => {
    await addReceipt('something that happened', 'read', 'bridge');
    const { getByTestId } = await render(<Settings />);

    fireEvent.press(getByTestId('settings-delete'));
    await waitFor(() =>
      expect(alertButtons.map((b) => b.text)).toEqual(['Keep it', 'Delete it all'])
    );

    // No act() wrapper: overlapping act scopes corrupt React's queue and every
    // later mount in the file comes back empty. Fire it, then waitFor outside.
    alertButtons[1].onPress?.();
    await waitFor(async () => expect(await listReceipts()).toEqual([]));
  });

  it('keeps the data when the confirm is declined', async () => {
    await addReceipt('something that happened', 'read', 'bridge');
    const { getByTestId } = await render(<Settings />);

    fireEvent.press(getByTestId('settings-delete'));
    await waitFor(() => expect(alertButtons).toHaveLength(2));
    alertButtons[0].onPress?.();
    await waitFor(async () => expect(await listReceipts()).toHaveLength(1));
  });
});
