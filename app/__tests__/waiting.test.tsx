import React from 'react';
import { render } from '@testing-library/react-native';
import WaitingScreen from '../waiting';

// Keep the test hermetic: stub the async data hooks so nothing resolves (and
// logs) after the test finishes, which otherwise fails jest under --ci.
jest.mock('../../src/features/auth/useSession', () => ({
  useSession: () => ({ session: null, loading: false }),
}));
jest.mock('../../src/features/pairing/useCouple', () => ({
  useCouple: () => ({ couple: null, loading: false, status: 'none' }),
}));
jest.mock('../../src/features/drops/useDropState', () => ({
  useDropState: () => ({ coupleDrop: null, loading: false, error: null }),
}));

describe('WaitingScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Drop the looping animation timers rather than firing them (firing reschedules
    // and logs after teardown).
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders the waiting state with heading and description', async () => {
    const { getByText } = await render(<WaitingScreen />);

    expect(getByText('looking for Dani…')).toBeTruthy();
    expect(
      getByText(
        'Your two views are still apart. The moment Dani plays, they snap into focus, that\'s the reveal.'
      )
    ).toBeTruthy();
    expect(getByText("you're in ✓")).toBeTruthy();
  });
});
