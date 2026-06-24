import { renderHook } from '@testing-library/react-native';
import { useProfile } from './useProfile';

jest.mock('../pairing/useCouple', () => ({
  useCouple: jest.fn(() => ({ couple: null, loading: false, status: 'none' })),
}));

const { useCouple } = require('../pairing/useCouple');

describe('useProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCouple.mockReturnValue({ couple: null, loading: false, status: 'none' });
  });

  it('returns demo fallbacks when there is no session', async () => {
    const { result } = await renderHook(() => useProfile());

    expect(result.current.name).toBe('Yash');
    expect(result.current.partnerName).toBe('Dani');
    expect(result.current.spiceLevel).toBe('Flirty');
    expect(result.current.streak).toBe(23);
    expect(result.current.togetherSince).toBe('February 2024');
  });

  it('returns demo fallbacks when couple exists but no session user', async () => {
    useCouple.mockReturnValue({
      couple: {
        id: 'couple-1',
        member_a: 'user-a',
        member_b: 'user-b',
        streak: 10,
        together_since: 'January 2025',
        status: 'active',
      },
      loading: false,
      status: 'active',
    });

    const { result } = await renderHook(() => useProfile());

    expect(result.current.name).toBe('Yash');
    expect(result.current.partnerName).toBe('Dani');
  });

  it('exposes updateProfile function', async () => {
    const { result } = await renderHook(() => useProfile());

    expect(typeof result.current.updateProfile).toBe('function');
  });
});
