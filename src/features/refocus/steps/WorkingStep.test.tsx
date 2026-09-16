import React from 'react';
import { render, cleanup, waitFor } from '@testing-library/react-native';
import { WorkingStep } from './WorkingStep';
import { analyzeV2 } from '../refocusActions';
import type { RefocusReadV2 } from '../../../content/refocus';

jest.mock('../refocusActions', () => ({
  analyzeV2: jest.fn(),
}));
const mockAnalyze = analyzeV2 as jest.Mock;

const READ: RefocusReadV2 = {
  schema: 'v2',
  bridge_decision: 'bridge',
  underneath: 'You were waiting to be asked.',
  not_wrong_about: 'The transfer was a duty, not a secret.',
  bridge: 'I am not angry about the money, I am hurt I heard after.',
  no_bridge: null,
};

function setup() {
  const onDone = jest.fn();
  const onError = jest.fn();
  const onCancel = jest.fn();
  const onSaveInstead = jest.fn();
  return {
    props: {
      userText: 'he went quiet',
      pastedChat: null,
      onDone,
      onError,
      onCancel,
      onSaveInstead,
    },
    onDone,
    onError,
  };
}

describe('WorkingStep', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('resolves the moment the read arrives — no artificial minimum', async () => {
    mockAnalyze.mockResolvedValueOnce({ read: READ });
    const { props, onDone } = setup();
    await render(<WorkingStep {...props} />);
    await waitFor(() => expect(onDone).toHaveBeenCalledWith({ read: READ }));
  });

  it('shows the honest first stage while working', async () => {
    mockAnalyze.mockReturnValueOnce(new Promise(() => {}));
    const { props } = setup();
    const { getByTestId } = await render(<WorkingStep {...props} />);
    expect(getByTestId('working-stage').props.children).toBe('Hearing you');
  });

  it('a failed read lands on the error path, never a canned result', async () => {
    mockAnalyze.mockResolvedValueOnce(null);
    const { props, onError } = setup();
    await render(<WorkingStep {...props} />);
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
  });

  it('passes the pasted chat through to the read', async () => {
    mockAnalyze.mockResolvedValueOnce({ read: READ });
    const { props } = setup();
    await render(<WorkingStep {...props} pastedChat={'Dani: forget it'} />);
    await waitFor(() =>
      expect(mockAnalyze).toHaveBeenCalledWith('he went quiet', 'Dani: forget it')
    );
  });
});
