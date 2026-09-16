import React from 'react';
import { render, fireEvent, cleanup, act } from '@testing-library/react-native';
import { CaptureStep } from './CaptureStep';

// Same pollution guard as IntroStep.test: the animated Btn/Press leave state
// that empties later mounts in a file.
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

function setup() {
  const onRead = jest.fn();
  const onJustSave = jest.fn();
  const onOpenReceipts = jest.fn();
  return {
    props: { insets, onRead, onJustSave, onOpenReceipts },
    onRead,
    onJustSave,
    onOpenReceipts,
  };
}

describe('CaptureStep', () => {
  afterEach(cleanup);

  it('opens on the question with the first-launch line', async () => {
    const { props } = setup();
    const { getByText } = await render(<CaptureStep {...props} />);
    expect(getByText('What happened?')).toBeTruthy();
    expect(getByText('Say it or type it. It stays yours.')).toBeTruthy();
  });

  it('Read it stays inert until words exist, then submits the account', async () => {
    const { props, onRead } = setup();
    const { getByTestId } = await render(<CaptureStep {...props} />);

    fireEvent.press(getByTestId('capture-read'));
    expect(onRead).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.changeText(
        getByTestId('capture-input'),
        'He went quiet after the money thing.'
      );
    });
    fireEvent.press(getByTestId('capture-read'));
    expect(onRead).toHaveBeenCalledWith(
      'He went quiet after the money thing.',
      null
    );
  });

  it('a stem tap appends the opener into the account', async () => {
    const { props, onRead } = setup();
    const { getByText, getByTestId } = await render(<CaptureStep {...props} />);

    await act(async () => {
      fireEvent.press(getByText('She said…'));
    });
    fireEvent.press(getByTestId('capture-read'));
    expect(onRead).toHaveBeenCalledWith('She said ', null);
  });

  it('Just save hands the words to the local path, no model call', async () => {
    const { props, onJustSave } = setup();
    const { getByTestId } = await render(<CaptureStep {...props} />);

    await act(async () => {
      fireEvent.changeText(getByTestId('capture-input'), 'flat all morning');
    });
    fireEvent.press(getByTestId('capture-save'));
    expect(onJustSave).toHaveBeenCalledWith('flat all morning', null);
  });

  it('Speak points at keyboard dictation (hint appears, input keeps focus path)', async () => {
    const { props } = setup();
    const { getByTestId } = await render(<CaptureStep {...props} />);

    await act(async () => {
      fireEvent.press(getByTestId('capture-speak'));
    });
    expect(getByTestId('speak-hint').props.children).toContain(
      'Tap the mic on your keyboard'
    );
  });
});
