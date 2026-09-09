import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { ResultStep } from './ResultStep';
import type { RefocusResult } from '../../../content/refocus';

const insets = { top: 0, bottom: 0, left: 0, right: 0 } as ReturnType<
  typeof import('react-native-safe-area-context').useSafeAreaInsets
>;

const RESULT: RefocusResult = {
  happened: ['A weekend was booked without checking'],
  angles: ['He may have read "we\'ll see" as a yes'],
  underneath: 'Saturday was the one that moved, again.',
  wayback: 'Ask before a shared day gets given away.',
  bridge: 'I shouldn/t have brought your mum into it. That bit I take back.',
};

function setup() {
  const props = {
    insets,
    result: RESULT,
    soloSessionId: 'session-1',
    onBack: jest.fn(),
    onShowToast: jest.fn(),
    onOpenLoveMap: jest.fn(),
  };
  return { props };
}

describe('ResultStep', () => {
  // The sentence is the product; the analysis is support. It has to be the
  // first thing on screen, not the last.
  it('renders the bridge above the reflection sections', async () => {
    const { props } = setup();
    const { getByTestId, toJSON } = await render(<ResultStep {...props} />);

    // The bridge lives in a TextInput value, so match on the rendered tree.
    expect(getByTestId('bridge-input').props.value).toBe(RESULT.bridge);
    const flat = JSON.stringify(toJSON());
    const bridgeAt = flat.indexOf('bridge-input');
    const happenedAt = flat.indexOf('what happened');
    expect(bridgeAt).toBeGreaterThan(-1);
    expect(happenedAt).toBeGreaterThan(-1);
    expect(bridgeAt).toBeLessThan(happenedAt);
  });

  // Touching it is what makes the concession the user's own rather than ours.
  it('labels the copy action as needing an edit first', async () => {
    const { props } = setup();
    const { getByText } = await render(<ResultStep {...props} />);

    expect(getByText('Edit to copy')).toBeTruthy();
  });

  it('does not copy while the draft is untouched, and says why', async () => {
    const { props } = setup();
    const { getByText } = await render(<ResultStep {...props} />);

    fireEvent.press(getByText('Edit to copy'));

    expect(props.onShowToast).toHaveBeenCalledWith(
      'Change a word first, so it is yours.',
    );
  });

  it('becomes copyable once the draft is edited', async () => {
    const { props } = setup();
    const { getByText, getByTestId } = await render(<ResultStep {...props} />);

    await act(async () => {
      fireEvent.changeText(getByTestId('bridge-input'), 'My own words entirely.');
    });

    expect(getByText('Copy to share')).toBeTruthy();
  });
});
