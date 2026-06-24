import React from 'react';
import { render, act } from '@testing-library/react-native';
import WaitingScreen from '../waiting';
import { usePlayStore } from '../../src/store/play';

// Configurable mocks set per test
let mockSession: object | null = null;
let mockCouple: object | null = null;
let mockCoupleDrop: { id: string; state: string } | null = null;
// Captures the id arg passed to useDropState by the component under test
let capturedDropStateId: string | null | undefined = undefined;

jest.mock('../../src/features/auth/useSession', () => ({
  useSession: () => ({ session: mockSession, loading: false }),
}));
jest.mock('../../src/features/pairing/useCouple', () => ({
  useCouple: () => ({ couple: mockCouple, loading: false, status: mockCouple ? 'active' : 'none' }),
}));
jest.mock('../../src/features/drops/useDropState', () => ({
  useDropState: (id: string | null) => {
    capturedDropStateId = id;
    return {
      coupleDrop: id !== null ? mockCoupleDrop : null,
      loading: false,
      error: null,
    };
  },
}));

describe('WaitingScreen — demo mode (no session)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockSession = null;
    mockCouple = null;
    mockCoupleDrop = null;
    capturedDropStateId = undefined;
    usePlayStore.setState({ coupleDropId: null });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders the waiting state with heading and description', async () => {
    const { getByText } = await render(<WaitingScreen />);

    expect(getByText('looking for Dani…')).toBeTruthy();
    expect(
      getByText(
        "Your two views are still apart. The moment Dani plays, they snap into focus, that's the reveal."
      )
    ).toBeTruthy();
    expect(getByText("you're in ✓")).toBeTruthy();
  });

  it('passes null to useDropState in demo mode (no session + no coupleDropId)', async () => {
    await render(<WaitingScreen />);
    expect(capturedDropStateId).toBeNull();
  });

  it('also passes null to useDropState when there is no couple even if coupleDropId is set', async () => {
    // Stale coupleDropId in store but no live couple — should still use null
    usePlayStore.setState({ coupleDropId: 'cd-stale' });
    await render(<WaitingScreen />);
    expect(capturedDropStateId).toBeNull();
  });
});

describe('WaitingScreen — live mode (session + couple)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockSession = { user: { id: 'me' } };
    mockCouple = { id: 'couple-1', member_a: 'me', member_b: 'them' };
    mockCoupleDrop = null;
    capturedDropStateId = undefined;
    usePlayStore.setState({ coupleDropId: 'cd-99' });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('passes the coupleDropId from the store to useDropState', async () => {
    await render(<WaitingScreen />);
    expect(capturedDropStateId).toBe('cd-99');
  });

  it('passes null to useDropState when coupleDropId is not yet set (submitted but id missing)', async () => {
    usePlayStore.setState({ coupleDropId: null });
    await render(<WaitingScreen />);
    // coupleDropId null → useDropState gets null even in live mode
    expect(capturedDropStateId).toBeNull();
  });

  it('renders the waiting screen without crash when coupleDrop.state is one_done', async () => {
    mockCoupleDrop = { id: 'cd-99', state: 'one_done' };
    const { getByText } = await render(<WaitingScreen />);
    // Should still render — not yet revealed, so we stay on waiting screen
    expect(getByText('looking for Dani…')).toBeTruthy();
  });
});
