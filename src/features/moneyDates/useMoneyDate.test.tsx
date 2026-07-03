import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useMoneyDate } from './useMoneyDate';
import { fetchMoneyDateState } from './moneyDateActions';
import { useSession } from '../auth/useSession';
import { useCouple } from '../pairing/useCouple';

jest.mock('./moneyDateActions', () => ({
  fetchMoneyDateState: jest.fn(),
}));
jest.mock('../auth/useSession', () => ({
  useSession: jest.fn(),
}));
jest.mock('../pairing/useCouple', () => ({
  useCouple: jest.fn(),
}));

const mockFetch = fetchMoneyDateState as jest.Mock;
const mockUseSession = useSession as jest.Mock;
const mockUseCouple = useCouple as jest.Mock;

const STATE = {
  open: null,
  last_completed_at: '2026-06-12T09:30:00+00:00',
  last_agreed_action: 'coffee from home',
  sessions_completed: 2,
};

describe('useMoneyDate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('is a sample (local demo) without a session — and never fetches', async () => {
    mockUseSession.mockReturnValue({ session: null });
    mockUseCouple.mockReturnValue({ couple: null, loading: false, status: 'none' });

    const { result } = await renderHook(() => useMoneyDate());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isSample).toBe(true);
    expect(result.current.state).toBeNull();
    expect(result.current.coupleId).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('fetches the real state for a paired couple', async () => {
    mockUseSession.mockReturnValue({ session: { user: { id: 'user-1' } } });
    mockUseCouple.mockReturnValue({ couple: { id: 'couple-1' }, loading: false, status: 'active' });
    mockFetch.mockResolvedValue(STATE);

    const { result } = await renderHook(() => useMoneyDate());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetch).toHaveBeenCalledWith('couple-1');
    expect(result.current.isSample).toBe(false);
    expect(result.current.state).toEqual(STATE);
    expect(result.current.coupleId).toBe('couple-1');
    expect(result.current.error).toBeNull();
  });

  it('surfaces a fetch failure as an error — never sample data for a real couple', async () => {
    mockUseSession.mockReturnValue({ session: { user: { id: 'user-1' } } });
    mockUseCouple.mockReturnValue({ couple: { id: 'couple-1' }, loading: false, status: 'active' });
    mockFetch.mockRejectedValue(new Error('network down'));

    const { result } = await renderHook(() => useMoneyDate());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe('network down');
    expect(result.current.state).toBeNull();
    expect(result.current.isSample).toBe(false);
  });

  it('refetch clears the error and reloads', async () => {
    mockUseSession.mockReturnValue({ session: { user: { id: 'user-1' } } });
    mockUseCouple.mockReturnValue({ couple: { id: 'couple-1' }, loading: false, status: 'active' });
    mockFetch.mockRejectedValueOnce(new Error('network down')).mockResolvedValueOnce(STATE);

    const { result } = await renderHook(() => useMoneyDate());
    await waitFor(() => expect(result.current.error).not.toBeNull());

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.state).toEqual(STATE));
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
