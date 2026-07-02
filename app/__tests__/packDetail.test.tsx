import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

const mockStore = { isPro: false };

jest.mock('../../src/features/purchases/usePurchases', () => ({
  usePurchases: jest.fn((selector: (s: { isPro: boolean }) => unknown) => selector(mockStore)),
}));

// Mock the nav helper
jest.mock('../../src/lib/nav', () => ({
  safeBack: jest.fn(),
}));

const mockPush = jest.fn();
const mockParams: { id?: string } = {};
jest.mock('expo-router', () => ({
  __esModule: true,
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

const mockCouple: { couple: { id: string } | null } = { couple: { id: 'couple-1' } };
jest.mock('../../src/features/pairing/useCouple', () => ({
  useCouple: () => mockCouple,
}));

jest.mock('../../src/features/profile/useIdentity', () => ({
  useIdentity: () => ({
    me: { name: 'Yash', initial: 'Y' },
    partner: { name: 'Dani', initial: 'D', hasPartner: true },
    loading: false,
  }),
}));

const mockSamples = {
  samples: [] as string[],
  loading: false,
  error: null as Error | null,
  refetch: jest.fn(),
};
const mockUsePackSamples = jest.fn((_theme: string | null) => mockSamples);
jest.mock('../../src/features/packs/usePackSamples', () => ({
  usePackSamples: (theme: string | null) => mockUsePackSamples(theme),
}));

const mockRpc = jest.fn();
jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

import PackDetailScreen from '../packDetail';

describe('PackDetailScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockStore.isPro = false;
    mockCouple.couple = { id: 'couple-1' };
    delete mockParams.id;
    mockSamples.samples = [
      'what do i worry about most?',
      'when did you know?',
      'what does home mean now?',
    ];
    mockSamples.loading = false;
    mockSamples.error = null;
    mockRpc.mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the free pack with real catalog samples and the real queue CTA', async () => {
    const { getByText, queryByText } = await render(<PackDetailScreen />);

    expect(getByText('pack')).toBeTruthy();
    expect(getByText("what's inside")).toBeTruthy();

    // Samples come from the live catalog hook, keyed by the pack's DB theme.
    expect(mockUsePackSamples).toHaveBeenCalledWith('deeper');
    expect(getByText('what do i worry about most?')).toBeTruthy();
    expect(getByText('when did you know?')).toBeTruthy();
    expect(getByText('what does home mean now?')).toBeTruthy();

    // No fake send anywhere — the CTA is the real send_pack queue.
    expect(queryByText(/Send drop to/)).toBeNull();
    expect(getByText('Queue for tomorrow')).toBeTruthy();
    expect(
      getByText(
        'Queue it and tomorrow\'s drop comes from this pack — you and Dani both answer + place hunches, same as always.'
      )
    ).toBeTruthy();
  });

  it('queues the pack through send_pack with the couple and DB theme, then confirms', async () => {
    const { getByText, getAllByText, queryByText } = await render(<PackDetailScreen />);

    await act(async () => {
      fireEvent.press(getByText('Queue for tomorrow'));
    });

    expect(mockRpc).toHaveBeenCalledWith('send_pack', {
      p_couple: 'couple-1',
      p_theme: 'deeper',
    });
    expect(mockRpc).toHaveBeenCalledTimes(1);

    // Confirmation only after the RPC succeeded (note + toast), never toast-only.
    expect(
      getAllByText("queued — tomorrow's drop comes from Deep end").length
    ).toBe(2);
    expect(queryByText('Queue for tomorrow')).toBeNull();
  });

  it('shows the honest failure toast when send_pack errors, and keeps the CTA', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'not a member' } });

    const { getByText, queryByText } = await render(<PackDetailScreen />);

    await act(async () => {
      fireEvent.press(getByText('Queue for tomorrow'));
    });

    expect(getByText("Couldn't queue Deep end — try again.")).toBeTruthy();
    expect(queryByText(/queued — tomorrow's drop comes from/)).toBeNull();
    expect(getByText('Queue for tomorrow')).toBeTruthy();
  });

  it('shows the rotation note instead of a queue CTA when there is no couple (demo)', async () => {
    mockCouple.couple = null;

    const { getByText, queryByText } = await render(<PackDetailScreen />);

    expect(queryByText('Queue for tomorrow')).toBeNull();
    expect(getByText('these land in your daily rotation — no sending needed')).toBeTruthy();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('renders a locked pack with the real Plus unlock path to the single paywall entry', async () => {
    mockParams.id = 'memory';
    const { getByText, queryByText } = await render(<PackDetailScreen />);

    expect(mockUsePackSamples).toHaveBeenCalledWith('memory');
    expect(getByText('Unlock with Plus')).toBeTruthy();
    expect(queryByText('Queue for tomorrow')).toBeNull();
    expect(queryByText(/Send drop to/)).toBeNull();
    expect(
      getByText(
        'A themed drop for when you want to go there. Unlock Plus to peek at every question inside — drops like these land in your daily rotation.'
      )
    ).toBeTruthy();

    fireEvent.press(getByText('Unlock with Plus'));
    expect(mockPush).toHaveBeenCalledWith('/(sheets)/plus');
  });

  it('explains the spice gate on the after-dark pack for a Plus couple', async () => {
    mockParams.id = 'spicy';
    mockStore.isPro = true;
    const { getByText, queryByText } = await render(<PackDetailScreen />);

    expect(queryByText(/Send drop to/)).toBeNull();
    expect(queryByText('Queue for tomorrow')).toBeNull();
    expect(
      getByText('these join your rotation once you and Dani both set your spice to spicy')
    ).toBeTruthy();
  });

  it('shows the honest loading and error states for the sample list', async () => {
    mockSamples.loading = true;
    const first = await render(<PackDetailScreen />);
    expect(first.getByText('loading real questions…')).toBeTruthy();
    first.unmount();

    mockSamples.loading = false;
    mockSamples.error = new Error('offline');
    const second = await render(<PackDetailScreen />);
    expect(second.getByText("Couldn't load this pack's questions.")).toBeTruthy();

    fireEvent.press(second.getByText('Try again'));
    expect(mockSamples.refetch).toHaveBeenCalledTimes(1);
  });
});
