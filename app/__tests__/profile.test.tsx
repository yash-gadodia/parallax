import React from 'react';
import { render } from '@testing-library/react-native';
import ProfileScreen from '../profile';

jest.mock('../../src/lib/nav', () => ({
  safeBack: jest.fn(),
}));

jest.mock('../../src/features/pairing/useCouple', () => ({
  useCouple: jest.fn(() => ({
    couple: { id: 'test-couple-id' },
  })),
}));

jest.mock('../../src/features/engagement/engagementActions', () => ({
  nudge: jest.fn(() => Promise.resolve()),
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

describe('ProfileScreen', () => {
  it('renders real identity from useProfile', async () => {
    const { getByText } = await render(<ProfileScreen />);

    expect(getByText('Alex')).toBeTruthy();
    expect(getByText('paired with')).toBeTruthy();
    expect(getByText('Jordan')).toBeTruthy();
    expect(getByText('Spicy')).toBeTruthy();
  });

  it('renders nudge banner with real partner name', async () => {
    const { getByText } = await render(<ProfileScreen />);

    expect(getByText('Give Jordan a nudge')).toBeTruthy();
    expect(getByText('Send a nudge')).toBeTruthy();
  });

  it('renders preferences and account sections', async () => {
    const { getByText } = await render(<ProfileScreen />);

    expect(getByText('preferences')).toBeTruthy();
    expect(getByText('Notifications')).toBeTruthy();
    expect(getByText('account')).toBeTruthy();
    expect(getByText('Log out')).toBeTruthy();
    expect(getByText('Unpair from Jordan')).toBeTruthy();
  });
});
