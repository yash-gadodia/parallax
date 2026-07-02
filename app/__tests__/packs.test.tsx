import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  __esModule: true,
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));

jest.mock('../../src/lib/nav', () => ({
  safeBack: jest.fn(),
}));

const mockStore = { isPro: false };

jest.mock('../../src/features/purchases/usePurchases', () => ({
  usePurchases: jest.fn((selector: (s: { isPro: boolean }) => unknown) => selector(mockStore)),
}));

import PacksScreen from '../packs';

describe('PacksScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.isPro = false;
  });

  it('renders the packs screen with key sections', async () => {
    const { getByText, queryByText } = await render(<PacksScreen />);

    // Check main heading
    expect(getByText('Packs')).toBeTruthy();

    // Honest copy: packs surface via the daily rotation — there is no send.
    expect(
      getByText(/Themed questions that land in your daily rotation with Dani/)
    ).toBeTruthy();
    expect(queryByText(/Send Dani/)).toBeNull();

    // Check pack titles are rendered
    expect(getByText('Deep end')).toBeTruthy();
    expect(getByText('After dark')).toBeTruthy();
    expect(getByText('Chaos hour')).toBeTruthy();
    expect(getByText('Rewind')).toBeTruthy();

    // Check upsell section exists
    expect(getByText('parallax plus')).toBeTruthy();
    expect(getByText('One sub, both of you.')).toBeTruthy();
  });

  it('routes a free user from Try Plus to the single paywall entry, not manageSub', async () => {
    const { getByText } = await render(<PacksScreen />);

    fireEvent.press(getByText('Try Plus'));
    expect(mockPush).toHaveBeenCalledWith('/(sheets)/plus');
    expect(mockPush).not.toHaveBeenCalledWith('/manageSub');
    expect(mockPush).not.toHaveBeenCalledWith('/checkout');
  });

  it('routes a Plus user from Manage Plus to manageSub', async () => {
    mockStore.isPro = true;

    const { getByText } = await render(<PacksScreen />);

    fireEvent.press(getByText('Manage Plus'));
    expect(mockPush).toHaveBeenCalledWith('/manageSub');
  });
});
