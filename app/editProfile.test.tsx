import React from 'react';
import { render } from '@testing-library/react-native';
import EditProfileScreen from './editProfile';

describe('EditProfileScreen', () => {
  it('renders the edit profile form with all fields and partner info', async () => {
    const { getByText } = await render(<EditProfileScreen />);

    // Check title
    expect(getByText('edit profile')).toBeTruthy();

    // Check field labels
    expect(getByText('Your name')).toBeTruthy();
    expect(getByText('Together since')).toBeTruthy();

    // Check partner section
    expect(getByText('paired with')).toBeTruthy();
    expect(getByText('Dani')).toBeTruthy();
    expect(getByText('LINKED')).toBeTruthy();

    // Check buttons
    expect(getByText('Change photo')).toBeTruthy();
    expect(getByText('Save changes')).toBeTruthy();
  });
});
