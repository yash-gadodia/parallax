import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import LoginScreen from '../login';

jest.mock('../../src/features/auth/authActions', () => ({
  signInWithEmail: jest.fn(),
  signInWithApple: jest.fn(),
  signInWithGoogle: jest.fn(),
  requestPasswordReset: jest.fn(),
  isValidEmail: jest.requireActual('../../src/features/auth/authActions').isValidEmail,
}));

import { requestPasswordReset } from '../../src/features/auth/authActions';

const mockRequestReset = requestPasswordReset as jest.Mock;

// The real ui store's toast timer (1.9s) outlives the test worker; mock it.
const mockFireToast = jest.fn();
jest.mock('../../src/store/ui', () => ({
  useUiStore: () => ({ toast: null, fireToast: mockFireToast }),
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the login form with email and password fields', async () => {
    const { getByText } = await render(<LoginScreen />);

    // Assert stable literal strings from the screen
    expect(getByText('welcome back')).toBeTruthy();
    expect(getByText('Log in to your account')).toBeTruthy();
    expect(getByText('Log in')).toBeTruthy();
    expect(getByText('New here? Create an account')).toBeTruthy();
    expect(getByText('Forgot password?')).toBeTruthy();
  });

  it('opens the forgot-password form and sends a reset link for a valid email', async () => {
    mockRequestReset.mockResolvedValue(undefined);
    const screen = await render(<LoginScreen />);

    await fireEvent.press(screen.getByText('Forgot password?'));
    expect(await screen.findByText('Forgot your password?')).toBeTruthy();

    // __DEV__ pre-fills a valid email; type a specific one to assert exactly.
    await act(async () => {
      screen.getByPlaceholderText('you@example.com').props.onChangeText('yash@example.com');
    });
    await fireEvent.press(screen.getByText('Send reset link'));

    expect(mockRequestReset).toHaveBeenCalledWith('yash@example.com');
    expect(mockRequestReset).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Check your inbox')).toBeTruthy();
  });

  it('rejects an invalid email with an inline error and never calls requestPasswordReset', async () => {
    const screen = await render(<LoginScreen />);

    await fireEvent.press(screen.getByText('Forgot password?'));
    expect(await screen.findByText('Forgot your password?')).toBeTruthy();

    await act(async () => {
      screen.getByPlaceholderText('you@example.com').props.onChangeText('not-an-email');
    });
    await fireEvent.press(screen.getByText('Send reset link'));

    expect(await screen.findByText('Enter a valid email address')).toBeTruthy();
    expect(mockRequestReset).not.toHaveBeenCalled();
  });

  it('returns to the login form via "Back to log in"', async () => {
    const screen = await render(<LoginScreen />);

    await fireEvent.press(screen.getByText('Forgot password?'));
    expect(await screen.findByText('Forgot your password?')).toBeTruthy();

    await fireEvent.press(screen.getByText('Back to log in'));

    expect(await screen.findByText('Log in to your account')).toBeTruthy();
  });
});
