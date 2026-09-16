import React from 'react';
import { render, fireEvent, cleanup, act } from '@testing-library/react-native';
import { ReadResultStep } from './ReadResultStep';
import type { RefocusReadV2 } from '../../../content/refocus';

jest.mock('../../../components/Btn', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');
  return function MockBtn({ children, onPress, disabled, testID }: any) {
    return React.createElement(
      Pressable,
      { onPress: disabled ? undefined : onPress, disabled, testID },
      React.createElement(Text, {}, children)
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

const insets = { top: 0, bottom: 0, left: 0, right: 0 } as any;

const BRIDGE_READ: RefocusReadV2 = {
  schema: 'v2',
  bridge_decision: 'bridge',
  underneath: 'You were waiting to be asked, not told.',
  not_wrong_about: 'Sending to his parents is a duty he does not get to skip.',
  bridge:
    'I am not angry about the money. I am hurt I heard about it after. Can we say it before, even when it is a given?',
  no_bridge: null,
};

const NO_BRIDGE_READ: RefocusReadV2 = {
  schema: 'v2',
  bridge_decision: 'no_bridge',
  underneath: 'You were waiting to be asked, not told.',
  not_wrong_about: 'Going quiet was not a move against you.',
  bridge: '',
  no_bridge: {
    noticed: 'This was a flat Tuesday, not a rupture.',
    let_go: 'The honest thing is to let this one go.',
  },
};

function setup(read: RefocusReadV2, regenerated = false) {
  const onRegenerate = jest.fn();
  const onCopied = jest.fn();
  const onDone = jest.fn();
  return {
    props: { insets, read, regenerated, onRegenerate, onCopied, onDone },
    onRegenerate,
    onCopied,
    onDone,
  };
}

// NOTE: the no-bridge suite mounts FIRST deliberately — later mounts in a
// file can come back empty after animated unmounts (same pollution as
// IntroStep.test.tsx; verified passing in isolation before reordering).
describe('ReadResultStep — no bridge', () => {
  afterEach(cleanup);

  it('is a first-class result: headline, both cards, no copy, one Done', async () => {
    const { props, onDone } = setup(NO_BRIDGE_READ);
    const { getByText, queryByTestId, getByTestId } = await render(
      <ReadResultStep {...props} />
    );

    expect(getByText('There is no bridge here.')).toBeTruthy();
    expect(getByText('This was a flat Tuesday, not a rupture.')).toBeTruthy();
    expect(getByText('Going quiet was not a move against you.')).toBeTruthy();
    expect(queryByTestId('copy-bridge')).toBeNull();
    expect(queryByTestId('read-regenerate')).toBeNull();

    fireEvent.press(getByTestId('read-done'));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

describe('ReadResultStep — bridge', () => {
  afterEach(cleanup);

  it('gates Copy until the sentence is owned, and "Use it as is" is the escape', async () => {
    const { props, onCopied } = setup(BRIDGE_READ);
    const { getByTestId } = await render(<ReadResultStep {...props} />);

    fireEvent.press(getByTestId('copy-bridge'));
    expect(onCopied).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.press(getByTestId('use-as-is'));
    });
    await act(async () => {
      fireEvent.press(getByTestId('copy-bridge'));
    });
    expect(onCopied).toHaveBeenCalledTimes(1);
  });

  it('editing the sentence unlocks Copy', async () => {
    const { props, onCopied } = setup(BRIDGE_READ);
    const { getByTestId } = await render(<ReadResultStep {...props} />);

    await act(async () => {
      fireEvent.changeText(
        getByTestId('bridge-input'),
        'I am not angry about the money. I am hurt I heard after.'
      );
    });
    await act(async () => {
      fireEvent.press(getByTestId('copy-bridge'));
    });
    expect(onCopied).toHaveBeenCalledTimes(1);
  });

  it('the bridge arrives editable with the AI draft as the value', async () => {
    const { props } = setup(BRIDGE_READ);
    const { getByTestId } = await render(<ReadResultStep {...props} />);
    expect(getByTestId('bridge-input').props.value).toBe(BRIDGE_READ.bridge);
  });

  it('offers exactly one regenerate, then spends it', async () => {
    const first = setup(BRIDGE_READ, false);
    const { getByTestId, unmount } = await render(
      <ReadResultStep {...first.props} />
    );
    fireEvent.press(getByTestId('read-regenerate'));
    expect(first.onRegenerate).toHaveBeenCalledTimes(1);
    unmount();

    const spent = setup(BRIDGE_READ, true);
    const { queryByTestId } = await render(<ReadResultStep {...spent.props} />);
    expect(queryByTestId('read-regenerate')).toBeNull();
  });
});
