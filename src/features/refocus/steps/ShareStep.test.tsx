import React from 'react';
import { render, fireEvent, within } from '@testing-library/react-native';
import { ShareStep } from './ShareStep';

const insets = { top: 0, bottom: 0, left: 0, right: 0 } as ReturnType<
  typeof import('react-native-safe-area-context').useSafeAreaInsets
>;

function setup(overrides: Partial<React.ComponentProps<typeof ShareStep>> = {}) {
  const onSubmit = jest.fn();
  const onBack = jest.fn();
  const props = {
    insets,
    mode: 'paste' as const,
    text: 'we argued about the dishes again',
    setText: jest.fn(),
    onSubmit,
    onBack,
    ...overrides,
  };
  return { onSubmit, onBack, props };
}

describe('ShareStep', () => {
  // The submit button used to be position:absolute with no keyboard handling, so
  // on a multiline input (Return inserts a newline, never submits) the keyboard
  // covered "Untangle it" and the screen became a dead end.
  it('keeps the submit button inside the keyboard-avoiding container', async () => {
    const { props } = setup();
    const { getByTestId } = await render(<ShareStep {...props} />);

    const avoider = getByTestId('share-keyboard-avoider');
    expect(within(avoider).getByText('Untangle it')).toBeTruthy();
  });

  it('keeps the text input inside the keyboard-avoiding container', async () => {
    const { props } = setup();
    const { getByTestId } = await render(<ShareStep {...props} />);

    const avoider = getByTestId('share-keyboard-avoider');
    expect(
      within(avoider).getByPlaceholderText('Paste the messages here…'),
    ).toBeTruthy();
  });

  it('submits when the button is pressed with enough text', async () => {
    const { props, onSubmit } = setup();
    const { getByText } = await render(<ShareStep {...props} />);

    fireEvent.press(getByText('Untangle it'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('does not submit when the text is too short', async () => {
    const { props, onSubmit } = setup({ text: 'hi' });
    const { getByText } = await render(<ShareStep {...props} />);

    fireEvent.press(getByText('Untangle it'));

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });
});
