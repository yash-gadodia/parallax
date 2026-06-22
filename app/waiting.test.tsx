import React from 'react';
import { render } from '@testing-library/react-native';
import WaitingScreen from './waiting';

describe('WaitingScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders the waiting state with heading and description', async () => {
    const { getByText } = await render(<WaitingScreen />);

    // Assert the main heading is rendered
    expect(getByText('looking for Dani…')).toBeTruthy();

    // Assert the description text is rendered
    expect(
      getByText(
        'Your two views are still apart. The moment Dani plays, they snap into focus, that\'s the reveal.'
      )
    ).toBeTruthy();

    // Assert the status label is rendered
    expect(getByText("you're in ✓")).toBeTruthy();
  });
});
