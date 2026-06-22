import React from 'react';
import { render } from '@testing-library/react-native';
import PackDetailScreen from './packDetail';
import { usePurchases } from '../src/features/purchases/usePurchases';

// Mock the purchases hook to return non-plus user (unlocked pack)
jest.mock('../src/features/purchases/usePurchases', () => ({
  usePurchases: jest.fn(() => false),
}));

// Mock the nav helper
jest.mock('../src/lib/nav', () => ({
  safeBack: jest.fn(),
}));

describe('PackDetailScreen', () => {
  it('renders the pack detail screen with title and CTA', async () => {
    const { getByText } = await render(<PackDetailScreen />);

    // Assert the TopBar title
    expect(getByText('pack')).toBeTruthy();

    // Assert the "what's inside" section heading
    expect(getByText("what's inside")).toBeTruthy();

    // Assert the CTA button text (non-locked pack)
    expect(getByText('Send drop to Dani')).toBeTruthy();
  });
});
