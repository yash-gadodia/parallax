import React from 'react';
import { render } from '@testing-library/react-native';
import WrappedScreen from '../wrapped';

// The cover slide starts an Animated loop on mount; with real timers its
// ticks land outside act() and warn (E2E finding F7). Fake timers keep the
// animation from ticking during the assertion.
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('WrappedScreen', () => {
  it('renders the cover slide with title and cta text', async () => {
    const { getByText } = await render(<WrappedScreen />);

    // Assert the cover slide content is rendered
    expect(getByText('parallax · june')).toBeTruthy();
    expect(getByText(/Your month/)).toBeTruthy();
    expect(getByText('Yash & Dani · tap to begin →')).toBeTruthy();
  });
});
