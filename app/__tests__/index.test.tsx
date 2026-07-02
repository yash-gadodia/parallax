import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import HomeScreen from '../index';

jest.mock('../../src/features/auth/useSession', () => ({
  useSession: jest.fn(),
}));
jest.mock('../../src/features/pairing/useCouple', () => ({
  useCouple: jest.fn(),
}));
jest.mock('../../src/features/onboarding/flushIntents', () => ({
  flushPendingIntents: jest.fn(),
}));

// The gate probes the couples table to tell a fetch ERROR apart from a genuine
// "no couple" - control that probe per-test via mockProbeResult.
let mockProbeResult: { data: unknown; error: unknown };
const mockLimit = jest.fn(() => Promise.resolve(mockProbeResult));
jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: () => ({ select: () => ({ limit: mockLimit }) }),
  },
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
    mockLimit.mockClear();
    mockProbeResult = { data: [], error: null };
  });

  it('renders the branded loading frame (no redirect) while the session is still loading', async () => {
    mockUseSession.mockReturnValue({ session: null, loading: true });
    mockUseCouple.mockReturnValue({ couple: null, status: 'none', loading: false });

    const { getByTestId } = await render(<HomeScreen />);

    expect(getByTestId('branded-loading')).toBeOnTheScreen();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('renders the branded loading frame while the couple lookup is in flight', async () => {
    mockUseSession.mockReturnValue({ session: { user: { id: 'u1' } }, loading: false });
    mockUseCouple.mockReturnValue({ couple: null, status: 'none', loading: true });

    const { getByTestId } = await render(<HomeScreen />);

    expect(getByTestId('branded-loading')).toBeOnTheScreen();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('redirects an unauthenticated user to onboarding without probing', async () => {
    mockUseSession.mockReturnValue({ session: null, loading: false });
    mockUseCouple.mockReturnValue({ couple: null, status: 'none', loading: false });

    await render(<HomeScreen />);

    expect(mockRedirect).toHaveBeenCalledWith('/(onboarding)');
    expect(mockLimit).not.toHaveBeenCalled();
  });

  it('redirects a logged-in, paired user straight to today', async () => {
    mockUseSession.mockReturnValue({ session: { user: { id: 'u1' } }, loading: false });
    mockUseCouple.mockReturnValue({ couple: { id: 'c1' }, status: 'active', loading: false });

    await render(<HomeScreen />);

    expect(mockRedirect).toHaveBeenCalledWith('/(tabs)/today');
  });

  it('lets a pairing-pending user into the app to answer ahead', async () => {
    mockUseSession.mockReturnValue({ session: { user: { id: 'u1' } }, loading: false });
    mockUseCouple.mockReturnValue({ couple: { id: 'c1' }, status: 'pending', loading: false });

    await render(<HomeScreen />);

    expect(mockRedirect).toHaveBeenCalledWith('/(tabs)/today');
  });

  it('sends a logged-in user with no couple (probe reachable) to onboarding', async () => {
    mockUseSession.mockReturnValue({ session: { user: { id: 'u1' } }, loading: false });
    mockUseCouple.mockReturnValue({ couple: null, status: 'none', loading: false });

    await render(<HomeScreen />);

    await waitFor(() => expect(mockRedirect).toHaveBeenCalledWith('/(onboarding)'));
    expect(mockLimit).toHaveBeenCalledTimes(1);
  });

  it('shows the retry state instead of onboarding when the couple lookup errored', async () => {
    mockProbeResult = { data: null, error: { message: 'network request failed' } };
    mockUseSession.mockReturnValue({ session: { user: { id: 'u1' } }, loading: false });
    mockUseCouple.mockReturnValue({ couple: null, status: 'none', loading: false });

    const { findByText, getByText } = await render(<HomeScreen />);

    expect(await findByText('can’t reach parallax')).toBeOnTheScreen();
    expect(getByText('Check your connection and try again.')).toBeOnTheScreen();
    expect(getByText('Try again')).toBeOnTheScreen();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('pressing Try again refetches, and routes once the connection recovers', async () => {
    mockProbeResult = { data: null, error: { message: 'network request failed' } };
    mockUseSession.mockReturnValue({ session: { user: { id: 'u1' } }, loading: false });
    mockUseCouple.mockReturnValue({ couple: null, status: 'none', loading: false });

    const { findByTestId } = await render(<HomeScreen />);
    const retry = await findByTestId('retry-couple');
    expect(mockLimit).toHaveBeenCalledTimes(1);

    mockProbeResult = { data: [], error: null };
    // Async act so the remounted gate's probe promise settles inside act.
    await act(async () => {
      fireEvent.press(retry);
    });

    // The remounted gate re-runs the lookup probe (the refetch)...
    await waitFor(() => expect(mockLimit).toHaveBeenCalledTimes(2));
    // ...and with the probe green the honest route is onboarding.
    await waitFor(() => expect(mockRedirect).toHaveBeenCalledWith('/(onboarding)'));
  });
});
