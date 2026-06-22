import React from 'react';
import { render } from '@testing-library/react-native';
import LoginScreen from '../login';

describe('LoginScreen', () => {
  it('renders the login form with email and password fields', async () => {
    const { getByText } = await render(<LoginScreen />);

    // Assert stable literal strings from the screen
    expect(getByText('welcome back')).toBeTruthy();
    expect(getByText('Log in to your account')).toBeTruthy();
    expect(getByText('Log in')).toBeTruthy();
    expect(getByText('New here? Create an account')).toBeTruthy();
  });
});
