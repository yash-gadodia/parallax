import React from 'react';
import { render } from '@testing-library/react-native';
import PacksScreen from '../packs';

jest.mock('../../src/lib/nav', () => ({
  safeBack: jest.fn(),
}));

jest.mock('../../src/features/purchases/usePurchases', () => ({
  usePurchases: jest.fn((selector) => {
    if (typeof selector === 'function') {
      return selector({ isPro: false });
    }
    return false;
  }),
}));

describe('PacksScreen', () => {
  it('renders the packs screen with key sections', async () => {
    const { getByText } = await render(<PacksScreen />);

    // Check main heading
    expect(getByText('Packs')).toBeTruthy();

    // Check that description mentions sending packs (appears in both Plus and non-Plus)
    expect(getByText(/Send Dani/)).toBeTruthy();

    // Check pack titles are rendered
    expect(getByText('Deep end')).toBeTruthy();
    expect(getByText('After dark')).toBeTruthy();
    expect(getByText('Chaos hour')).toBeTruthy();
    expect(getByText('Someday')).toBeTruthy();

    // Check upsell section exists
    expect(getByText('parallax plus')).toBeTruthy();
    expect(getByText('One sub, both of you.')).toBeTruthy();
  });
});
