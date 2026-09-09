import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorStep } from './ErrorStep';

const TEXT =
  'He booked JB on Tuesday and told me Thursday like it was news. I said his mum was right about him.';

describe('ErrorStep', () => {
  // The screen promised "your words are safe" without ever showing them, so the
  // user had to take it on trust at the moment they trusted the app least.
  it('shows the text the user wrote back to them', async () => {
    const { getByText } = await render(
      <ErrorStep text={TEXT} onRetry={jest.fn()} onBack={jest.fn()} />,
    );

    expect(getByText(TEXT)).toBeTruthy();
  });

  it('renders without the text when none was captured', async () => {
    const { getByText, queryByText } = await render(
      <ErrorStep text="" onRetry={jest.fn()} onBack={jest.fn()} />,
    );

    expect(getByText('Try again')).toBeTruthy();
    expect(queryByText(TEXT)).toBeNull();
  });

  it('retries on the primary action', async () => {
    const onRetry = jest.fn();
    const { getByText } = await render(
      <ErrorStep text={TEXT} onRetry={onRetry} onBack={jest.fn()} />,
    );

    fireEvent.press(getByText('Try again'));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('goes back to what was written on the secondary action', async () => {
    const onBack = jest.fn();
    const { getByText } = await render(
      <ErrorStep text={TEXT} onRetry={jest.fn()} onBack={onBack} />,
    );

    fireEvent.press(getByText('Back to what I wrote'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
