import React from 'react';
import { render } from '@testing-library/react-native';
import EditProfileScreen from '../editProfile';

jest.mock('../../src/lib/nav', () => ({
  safeBack: jest.fn(),
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

describe('EditProfileScreen', () => {
  it('renders the edit profile form with all fields', async () => {
    const { getByText } = await render(<EditProfileScreen />);

    expect(getByText('edit profile')).toBeTruthy();
    expect(getByText('Your name')).toBeTruthy();
    expect(getByText('Together since')).toBeTruthy();
    expect(getByText('paired with')).toBeTruthy();
    expect(getByText('LINKED')).toBeTruthy();
    expect(getByText('Change photo')).toBeTruthy();
    expect(getByText('Save changes')).toBeTruthy();
  });

  it('renders real partner name from useProfile', async () => {
    const { getByText } = await render(<EditProfileScreen />);

    expect(getByText('Jordan')).toBeTruthy();
  });

  it('renders together since from useProfile', async () => {
    const { getByText } = await render(<EditProfileScreen />);

    expect(getByText('paired · March 2023')).toBeTruthy();
  });
});
