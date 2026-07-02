import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EditProfileScreen from '../editProfile';

jest.mock('../../src/lib/nav', () => ({
  safeBack: jest.fn(),
}));

jest.mock('../../src/features/pairing/useCouple', () => ({
  useCouple: jest.fn(() => ({
    couple: { id: 'test-couple-id' },
  })),
}));

const mockUpdateProfile = jest.fn();
jest.mock('../../src/features/profile/useProfile', () => ({
  useProfile: jest.fn(() => ({
    name: 'Alex',
    partnerName: 'Jordan',
    spiceLevel: 'Spicy',
    notifyTime: null,
    togetherSince: 'March 2023',
    streak: 42,
    loading: false,
    updateProfile: mockUpdateProfile,
  })),
}));

describe('EditProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateProfile.mockResolvedValue(undefined);
  });

  it('renders the edit profile form with all fields', async () => {
    const { getByText } = await render(<EditProfileScreen />);

    expect(getByText('edit profile')).toBeTruthy();
    expect(getByText('Your name')).toBeTruthy();
    expect(getByText('Together since')).toBeTruthy();
    expect(getByText('paired with')).toBeTruthy();
    expect(getByText('LINKED')).toBeTruthy();
    expect(getByText('Save changes')).toBeTruthy();
  });

  it('has no toast-only photo stub — the avatar is honestly your initial', async () => {
    const { queryByText, getByText } = await render(<EditProfileScreen />);

    expect(queryByText('Change photo')).toBeNull();
    expect(getByText('your initial is your face here, for now')).toBeTruthy();
  });

  it('saves changes: shows Saving…, then the saved toast', async () => {
    let resolveSave: () => void = () => {};
    mockUpdateProfile.mockImplementation(
      () => new Promise<void>((resolve) => (resolveSave = resolve))
    );
    const { getByText, findByText } = await render(<EditProfileScreen />);

    fireEvent.press(getByText('Save changes'));
    expect(await findByText('Saving…')).toBeTruthy();
    expect(mockUpdateProfile).toHaveBeenCalledWith('Alex', 'March 2023');

    resolveSave();
    expect(await findByText('Changes saved')).toBeTruthy();
  });

  it('surfaces a warm error toast and re-enables save when the update fails', async () => {
    mockUpdateProfile.mockRejectedValue(new Error('offline'));
    const { getByText, findByText } = await render(<EditProfileScreen />);

    fireEvent.press(getByText('Save changes'));

    expect(await findByText("couldn't save that — try again in a sec")).toBeTruthy();
    await waitFor(() => expect(getByText('Save changes')).toBeTruthy());
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
