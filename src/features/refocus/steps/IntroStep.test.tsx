import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react-native';
import { IntroStep } from './IntroStep';
import type { RefocusSession } from '../../../types/db';

// Btn/Press wrap Pressable in Animated.createAnimatedComponent. Pressing the
// real ones leaves animation state that empties a later mount in this file —
// same reason app/(tabs)/__tests__/refocus.test.tsx mocks them.
jest.mock('../../../components/Btn', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');
  return function MockBtn({ children, onPress, disabled, sub, testID }: any) {
    return React.createElement(
      Pressable,
      { onPress, disabled, testID },
      React.createElement(
        View,
        {},
        React.createElement(Text, {}, children),
        sub && React.createElement(Text, {}, sub),
      ),
    );
  };
});

jest.mock('../../../components/Press', () => {
  const React = require('react');
  const { Pressable } = require('react-native');
  return function MockPress({ children, onPress }: any) {
    return React.createElement(Pressable, { onPress }, children);
  };
});


const insets = { top: 0, bottom: 0, left: 0, right: 0 } as ReturnType<
  typeof import('react-native-safe-area-context').useSafeAreaInsets
>;

function setup(overrides: Partial<React.ComponentProps<typeof IntroStep>> = {}) {
  const onStartSolo = jest.fn();
  const onStartTogether = jest.fn();
  const props = {
    insets,
    canTogether: false,
    openSession: null as RefocusSession | null,
    myId: 'me',
    onStartTogether,
    onStartSolo,
    onBack: jest.fn(),
    ...overrides,
  };
  return { props, onStartSolo, onStartTogether };
}

describe('IntroStep', () => {
  afterEach(cleanup);

  // NOTE: this one mounts first deliberately. The first mount in this file
  // takes ~4.5s (async work on initial render) and a later mount in the same
  // file comes back empty — mocking Btn/Press and explicit cleanup did not fix
  // it. Verified correct in isolation (`-t "surfaces an open session"`).

  it('surfaces an open session the partner started', async () => {
    const openSession = {
      id: 's1',
      state: 'waiting_partner',
      initiator: 'them',
      topic: 'the dishes thing',
    } as RefocusSession;
    const { props } = setup({ canTogether: true, openSession });
    const { getByText } = await render(<IntroStep {...props} />);

    expect(getByText(/the dishes thing/)).toBeTruthy();
  });

  // v7 opens on a fight that has already happened, so the first session needs
  // no waiting and the record is never empty on arrival.
  it('asks for the last argument rather than describing the product', async () => {
    const { props } = setup();
    const { getByText } = await render(<IntroStep {...props} />);

    expect(getByText('Think of the last argument you had.')).toBeTruthy();
  });

  it('makes the solo path the primary action when there is no partner', async () => {
    const { props, onStartSolo } = setup();
    const { getByText } = await render(<IntroStep {...props} />);

    fireEvent.press(getByText('Start there'));

    expect(onStartSolo).toHaveBeenCalledTimes(1);
  });

  it('offers no together CTA when there is no couple', async () => {
    const { props } = setup();
    const { queryByText } = await render(<IntroStep {...props} />);

    expect(queryByText('Untangle it together')).toBeNull();
  });

  // Pairing stays reachable; it just stops being the entry fee.
  it('demotes the together path to a secondary action when a couple exists', async () => {
    const { props, onStartTogether, onStartSolo } = setup({ canTogether: true });
    const { getByText } = await render(<IntroStep {...props} />);

    fireEvent.press(getByText('Start there'));
    expect(onStartSolo).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Untangle it together'));
    expect(onStartTogether).toHaveBeenCalledTimes(1);
  });

});
