import React from 'react';
import { render } from '@testing-library/react-native';
import PackDetailScreen from '../packDetail';

const mockStore = { isPro: false };

jest.mock('../../src/features/purchases/usePurchases', () => ({
  usePurchases: jest.fn((selector: (s: { isPro: boolean }) => unknown) => selector(mockStore)),
}));

// Mock the nav helper
jest.mock('../../src/lib/nav', () => ({
  safeBack: jest.fn(),
}));

const mockParams: { id?: string } = {};
jest.mock('expo-router', () => ({
  __esModule: true,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

describe('PackDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.isPro = false;
    delete mockParams.id;
  });

  it('renders the free pack with the honest rotation note instead of a fake send', async () => {
    const { getByText, queryByText } = await render(<PackDetailScreen />);

    expect(getByText('pack')).toBeTruthy();
    expect(getByText("what's inside")).toBeTruthy();

    // No fake send anywhere — drops arrive via the daily rotation.
    expect(queryByText(/Send drop to/)).toBeNull();
    expect(
      getByText('these land in your daily rotation — no sending needed')
    ).toBeTruthy();
    expect(
      getByText(
        'Nothing to send — drops like these land in your daily rotation, and you and Dani both answer + place hunches, same as always.'
      )
    ).toBeTruthy();
  });

  it('renders a locked pack with the real Plus unlock path', async () => {
    mockParams.id = 'future';
    const { getByText, queryByText } = await render(<PackDetailScreen />);

    expect(getByText('Unlock with Plus')).toBeTruthy();
    expect(queryByText(/Send drop to/)).toBeNull();
    expect(
      getByText(
        'A themed drop for when you want to go there. Unlock Plus to peek at every question inside — drops like these land in your daily rotation.'
      )
    ).toBeTruthy();
  });

  it('explains the spice gate on the after-dark pack for a Plus couple', async () => {
    mockParams.id = 'spicy';
    mockStore.isPro = true;
    const { getByText, queryByText } = await render(<PackDetailScreen />);

    expect(queryByText(/Send drop to/)).toBeNull();
    expect(
      getByText('these join your rotation once you and Dani both set your spice to spicy')
    ).toBeTruthy();
  });
});
