import React from 'react';
import { render } from '@testing-library/react-native';
import PlusSheet from '../plus';

// Mock the purchases module since it calls native RevenueCat
jest.mock('../../../src/features/purchases/usePurchases', () => ({
  presentPaywall: jest.fn().mockResolvedValue(false),
}));

jest.mock('../../../src/features/purchases/client', () => ({
  purchasesAvailable: jest.fn().mockReturnValue(false),
}));

// Mock the navigation utility
jest.mock('../../../src/lib/nav', () => ({
  safeBack: jest.fn(),
}));

describe('PlusSheet', () => {
  it('renders the Plus subscription sheet with title and perks', async () => {
    const { getByText } = await render(<PlusSheet />);

    // Assert the main heading
    expect(getByText('One sub, both of you.')).toBeTruthy();

    // Assert the primary CTA
    expect(getByText('Start 7 days free')).toBeTruthy();

    // Assert the secondary action
    expect(getByText('Maybe later')).toBeTruthy();

    // Assert a perk title to verify the perks list rendered
    expect(getByText('Every themed pack')).toBeTruthy();
  });
});
