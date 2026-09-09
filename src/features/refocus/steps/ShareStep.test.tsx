import React from 'react';
import { render, fireEvent, within, act } from '@testing-library/react-native';
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


  // A flooded person should be able to reach an output having typed nothing:
  // the scaffold chips are a complete input on their own.
  it('renders the scaffold sentence above the box', async () => {
    const { props } = setup({ text: '' });
    const { getByText } = await render(<ShareStep {...props} />);

    expect(getByText('They')).toBeTruthy();
    expect(getByText('Then I')).toBeTruthy();
    expect(getByText('I wanted them to say')).toBeTruthy();
  });

  it('opens a sheet of options when a slot is tapped', async () => {
    const { props } = setup({ text: '' });
    const { getByText, getAllByText, queryByText } = await render(
      <ShareStep {...props} />,
    );

    expect(queryByText('went quiet on me')).toBeNull();
    await act(async () => {
      // "did what" is the placeholder for both `they` and `i`; the first is `they`.
      fireEvent.press(getAllByText('did what')[0]);
    });

    expect(getByText('went quiet on me')).toBeTruthy();
  });

  it('submits with a chip chosen and nothing typed', async () => {
    const { props, onSubmit } = setup({ text: '' });
    const { getByText, getAllByText } = await render(<ShareStep {...props} />);

    await act(async () => {
      fireEvent.press(getAllByText('did what')[0]);
    });
    await act(async () => {
      fireEvent.press(getByText('went quiet on me'));
    });
    fireEvent.press(getByText('Untangle it'));

    expect(onSubmit).toHaveBeenCalledWith('They went quiet on me.');
  });

  it('does not submit with no chip and nothing typed', async () => {
    const { props, onSubmit } = setup({ text: '' });
    const { getByText } = await render(<ShareStep {...props} />);

    fireEvent.press(getByText('Untangle it'));

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('submits the typed text when no chip is chosen', async () => {
    const { props, onSubmit } = setup();
    const { getByText } = await render(<ShareStep {...props} />);

    fireEvent.press(getByText('Untangle it'));

    expect(onSubmit).toHaveBeenCalledWith('we argued about the dishes again');
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
