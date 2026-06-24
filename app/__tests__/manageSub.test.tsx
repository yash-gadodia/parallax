import React from 'react';
import { render } from '@testing-library/react-native';
import ManageSubScreen from '../manageSub';

jest.mock('../../src/features/purchases/usePurchases', () => ({
  usePurchases: jest.fn((selector) => {
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

jest.mock('../../src/features/pairing/useCouple', () => ({
  useCouple: jest.fn(() => ({
    couple: { id: 'test-couple-id' },
  })),
}));

jest.mock('../../src/features/profile/useProfile', () => ({
  useProfile: jest.fn(() => ({
    name: 'Alex',
    partnerName: 'Jordan',
    spiceLevel: 'Spicy',
    notifyTime: null,
    togetherSince: 'March 2023',
    streak: 42,
    loading: false,
    updateProfile: jest.fn(),
  })),
}));

describe('ManageSubScreen', () => {
  it('renders the subscription management screen with status card and plan details', async () => {
    const { getByText } = await render(<ManageSubScreen />);

    expect(getByText('manage plus')).toBeTruthy();
    expect(getByText('Parallax Plus')).toBeTruthy();
    expect(getByText('● active · free trial')).toBeTruthy();
    expect(getByText('ANNUAL')).toBeTruthy();
    expect(getByText('Plan')).toBeTruthy();
    expect(getByText('Annual · $39.99/yr')).toBeTruthy();
    expect(getByText('Free trial ends')).toBeTruthy();
    expect(getByText('in 7 days')).toBeTruthy();
    expect(getByText('Renews')).toBeTruthy();
    expect(getByText('Jun 15, 2026')).toBeTruthy();
    expect(getByText('Shared with')).toBeTruthy();
    expect(getByText('Jordan')).toBeTruthy();
    expect(getByText('Switch to monthly')).toBeTruthy();
    expect(getByText('Cancel subscription')).toBeTruthy();
  });
});
