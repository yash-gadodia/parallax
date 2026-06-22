import { render, waitFor } from '@testing-library/react-native';

const mockReplace = jest.fn();
const mockRedirect = jest.fn();
let mockParams: { token_hash?: string } = {};

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
}));

import AuthCallback from '../auth-callback';
import { verifyEmailOtp } from '../../src/features/auth/authActions';

const mockVerify = verifyEmailOtp as jest.Mock;

describe('auth-callback route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
  });

  it('verifies a valid token_hash and redirects home', async () => {
    mockParams = { token_hash: 'goodhash' };
    mockVerify.mockResolvedValue(undefined);

    await render(<AuthCallback />);

    await waitFor(() => expect(mockVerify).toHaveBeenCalledWith('goodhash'));
    await waitFor(() => expect(mockRedirect).toHaveBeenCalledWith('/'));
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
});
