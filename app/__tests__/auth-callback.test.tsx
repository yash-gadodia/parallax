import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

const mockReplace = jest.fn();
const mockRedirect = jest.fn();
let mockParams: { token_hash?: string; type?: string } = {};

jest.mock('expo-router', () => ({
  __esModule: true,
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => mockParams,
  Redirect: (props: { href: string }) => {
    mockRedirect(props.href);
    return null;
  },
}));

jest.mock('../../src/features/auth/authActions', () => ({
  verifyEmailOtp: jest.fn(),
  resendConfirmationEmail: jest.fn(),
  isValidEmail: jest.requireActual('../../src/features/auth/authActions').isValidEmail,
}));

import AuthCallback from '../auth-callback';
import { verifyEmailOtp, resendConfirmationEmail } from '../../src/features/auth/authActions';

const mockVerify = verifyEmailOtp as jest.Mock;
const mockResend = resendConfirmationEmail as jest.Mock;

// The real ui store's toast timer (1.9s) outlives the test worker; mock it.
const mockFireToast = jest.fn();
jest.mock('../../src/store/ui', () => ({
  useUiStore: () => ({ toast: null, fireToast: mockFireToast }),
}));

describe('auth-callback route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
  });

  it('verifies a valid token_hash as a signup OTP and redirects home', async () => {
    mockParams = { token_hash: 'goodhash' };
    mockVerify.mockResolvedValue(undefined);

    await render(<AuthCallback />);

    await waitFor(() => expect(mockVerify).toHaveBeenCalledWith('goodhash', 'signup'));
    await waitFor(() => expect(mockRedirect).toHaveBeenCalledWith('/'));
  });

  it('verifies a recovery link as a recovery OTP and redirects to the set-new-password screen', async () => {
    mockParams = { token_hash: 'recoveryhash', type: 'recovery' };
    mockVerify.mockResolvedValue(undefined);

    await render(<AuthCallback />);

    await waitFor(() => expect(mockVerify).toHaveBeenCalledWith('recoveryhash', 'recovery'));
    await waitFor(() => expect(mockRedirect).toHaveBeenCalledWith('/resetPassword'));
  });

  it('shows an expired-link message when no token is present', async () => {
    mockParams = {};

    const { findByText } = await render(<AuthCallback />);

    expect(await findByText('This link has expired')).toBeTruthy();
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it('shows an expired-link message when verification fails', async () => {
    mockParams = { token_hash: 'stale' };
    mockVerify.mockRejectedValue(new Error('expired'));

    const { findByText } = await render(<AuthCallback />);

    expect(await findByText('This link has expired')).toBeTruthy();
    expect(mockRedirect).not.toHaveBeenCalledWith('/');
  });

  it('resends the confirmation email from the error state and starts a 30s cooldown', async () => {
    mockParams = {};
    mockResend.mockResolvedValue(undefined);

    const screen = await render(<AuthCallback />);
    expect(await screen.findByText('This link has expired')).toBeTruthy();

    await act(async () => {
      screen.getByPlaceholderText('you@example.com').props.onChangeText('yash@example.com');
    });
    await fireEvent.press(screen.getByText('Resend confirmation email'));
    expect(mockResend).toHaveBeenCalledWith('yash@example.com');
    expect(mockResend).toHaveBeenCalledTimes(1);
    expect(mockFireToast).toHaveBeenCalledWith('Confirmation email re-sent');
    expect(screen.getByText('Resend in 30s')).toBeTruthy();
  });

  it('rejects an invalid email with an inline error and never calls resend', async () => {
    mockParams = {};

    const screen = await render(<AuthCallback />);
    expect(await screen.findByText('This link has expired')).toBeTruthy();

    await act(async () => {
      screen.getByPlaceholderText('you@example.com').props.onChangeText('nope');
    });
    await fireEvent.press(screen.getByText('Resend confirmation email'));

    expect(await screen.findByText('Enter a valid email address')).toBeTruthy();
    expect(mockResend).not.toHaveBeenCalled();
  });

  it('does not offer a confirmation resend for an expired recovery link', async () => {
    mockParams = { token_hash: 'stale', type: 'recovery' };
    mockVerify.mockRejectedValue(new Error('expired'));

    const screen = await render(<AuthCallback />);

    expect(await screen.findByText('This link has expired')).toBeTruthy();
    expect(screen.queryByText('Resend confirmation email')).toBeNull();
  });
});
