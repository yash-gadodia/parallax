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

describe('ProfileScreen', () => {
  it('renders the profile screen with key sections', async () => {
    const { getByText } = await render(<ProfileScreen />);

    // Check identity card
    expect(getByText('Yash')).toBeTruthy();
    expect(getByText('paired with')).toBeTruthy();
    expect(getByText('Dani')).toBeTruthy();

    // Check nudge banner
    expect(getByText('Give Dani a nudge')).toBeTruthy();
    expect(getByText('Send a nudge')).toBeTruthy();

    // Check preferences section
    expect(getByText('preferences')).toBeTruthy();
    expect(getByText('Notifications')).toBeTruthy();

    // Check account section
    expect(getByText('account')).toBeTruthy();
  });
});
