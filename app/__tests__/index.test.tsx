import { render } from '@testing-library/react-native';
import HomeScreen from '../index';

jest.mock('../../src/features/auth/useSession', () => ({
  useSession: jest.fn(),
}));
jest.mock('../../src/features/pairing/useCouple', () => ({
  useCouple: jest.fn(),
}));

const mockRedirect = jest.fn();
jest.mock('expo-router', () => ({
  Redirect: (props: { href: string }) => {
    mockRedirect(props.href);
    return null;
  },
}));

import { useSession } from '../../src/features/auth/useSession';
import { useCouple } from '../../src/features/pairing/useCouple';

const mockUseSession = useSession as jest.Mock;
const mockUseCouple = useCouple as jest.Mock;

describe('root index routing guard', () => {
  beforeEach(() => {
    mockRedirect.mockClear();
  });

  it('renders no redirect while the session is still loading', async () => {
    mockUseSession.mockReturnValue({ session: null, loading: true });
    mockUseCouple.mockReturnValue({ couple: null, status: 'none', loading: false });

    await render(<HomeScreen />);

    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('redirects an unauthenticated user to onboarding', async () => {
    mockUseSession.mockReturnValue({ session: null, loading: false });
    mockUseCouple.mockReturnValue({ couple: null, status: 'none', loading: false });

    await render(<HomeScreen />);

    expect(mockRedirect).toHaveBeenCalledWith('/(onboarding)');
  });

  it('redirects a logged-in, paired user straight to today', async () => {
    mockUseSession.mockReturnValue({ session: { user: { id: 'u1' } }, loading: false });
    mockUseCouple.mockReturnValue({ couple: { id: 'c1' }, status: 'active', loading: false });

    await render(<HomeScreen />);

    expect(mockRedirect).toHaveBeenCalledWith('/(tabs)/today');
  });

  it('keeps a logged-in but unpaired user in onboarding', async () => {
    mockUseSession.mockReturnValue({ session: { user: { id: 'u1' } }, loading: false });
    mockUseCouple.mockReturnValue({ couple: null, status: 'pending', loading: false });

    await render(<HomeScreen />);

    expect(mockRedirect).toHaveBeenCalledWith('/(onboarding)');
  });
});
