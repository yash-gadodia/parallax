import React from 'react';
import { render } from '@testing-library/react-native';
import ManageSubScreen from '../manageSub';

// Mock the purchases hook and functions
jest.mock('../../src/features/purchases/usePurchases', () => ({
  usePurchases: jest.fn((selector) => {
    // Mock the store with a setDemoPro function
    const store = {
      setDemoPro: jest.fn(),
    };
    return selector(store);
  }),
  presentCustomerCenter: jest.fn(),
}));

jest.mock('../../src/features/purchases/client', () => ({
  purchasesAvailable: jest.fn(() => false),
}));

describe('ManageSubScreen', () => {
  it('renders the subscription management screen with status card and plan details', async () => {
    const { getByText } = await render(<ManageSubScreen />);

    // Assert the screen title via TopBar
    expect(getByText('manage plus')).toBeTruthy();

    // Assert the status card heading
    expect(getByText('Parallax Plus')).toBeTruthy();

    // Assert the status badge text
    expect(getByText('● active · free trial')).toBeTruthy();

    // Assert the annual badge
    expect(getByText('ANNUAL')).toBeTruthy();

    // Assert plan details rows
    expect(getByText('Plan')).toBeTruthy();
    expect(getByText('Annual · $39.99/yr')).toBeTruthy();
    expect(getByText('Free trial ends')).toBeTruthy();
    expect(getByText('in 7 days')).toBeTruthy();
    expect(getByText('Renews')).toBeTruthy();
    expect(getByText('Jun 15, 2026')).toBeTruthy();
    expect(getByText('Shared with')).toBeTruthy();
    expect(getByText('Dani')).toBeTruthy();

    // Assert action buttons
    expect(getByText('Switch to monthly')).toBeTruthy();
    expect(getByText('Cancel subscription')).toBeTruthy();
  });
});
