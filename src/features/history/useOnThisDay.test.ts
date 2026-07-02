import { renderHook, waitFor } from '@testing-library/react-native';
import { useOnThisDay } from './useOnThisDay';

jest.mock('../auth/useSession', () => ({ useSession: jest.fn() }));
jest.mock('../pairing/useCouple', () => ({ useCouple: jest.fn() }));
jest.mock('../lovemap/useCoupleHistory', () => ({ useCoupleHistory: jest.fn() }));
jest.mock('../drops/dropActions', () => ({ fetchReveal: jest.fn() }));
jest.mock('../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { useSession } from '../auth/useSession';
import { useCouple } from '../pairing/useCouple';
import { useCoupleHistory } from '../lovemap/useCoupleHistory';
import { fetchReveal } from '../drops/dropActions';
import { supabase } from '../../lib/supabase';

const mockUseSession = useSession as jest.Mock;
const mockUseCouple = useCouple as jest.Mock;
const mockUseCoupleHistory = useCoupleHistory as jest.Mock;
const mockFetchReveal = fetchReveal as jest.Mock;
const mockFrom = (supabase as unknown as { from: jest.Mock }).from;

const HISTORY = [
  { date: '2026-07-01', code: 'W3', title: 'small rituals', wavelength: 66, twins_count: 1 },
  { date: '2026-06-28', code: 'W2', title: 'the deep end', wavelength: 92, twins_count: 2 },
  { date: '2026-06-27', code: 'W1', title: 'soft launch', wavelength: 74, twins_count: 1 },
];

const PROMPTS = [
  { id: 'p1', emoji: '🍜', question: 'comfort food?', options: ['ramen', 'pizza'] },
];
const ANSWERS = [{ youPick: 0, youHunch: 1, themPick: 0, themHunch: 0 }];

function mockCoupleDropLookup(id: string | null) {
  const maybeSingle = jest.fn().mockResolvedValue({ data: id ? { id } : null, error: null });
  const eqDate = jest.fn().mockReturnValue({ maybeSingle });
  const eqCouple = jest.fn().mockReturnValue({ eq: eqDate });
  const select = jest.fn().mockReturnValue({ eq: eqCouple });
  mockFrom.mockReturnValue({ select });
  return { select, eqCouple, eqDate };
}

describe('useOnThisDay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({ session: { user: { id: 'u1' } }, loading: false });
    mockUseCouple.mockReturnValue({ couple: { id: 'c1' }, loading: false, status: 'active' });
    mockUseCoupleHistory.mockReturnValue({
      history: HISTORY,
      loading: false,
      isSample: false,
      error: null,
    });
    mockFetchReveal.mockResolvedValue({
      state: 'revealed',
      reveal: { wave: 92, yourHits: 1, theirHits: 1, twins: 1 },
      prompts: PROMPTS,
      promptAnswers: ANSWERS,
    });
  });

  it('picks the highest-wave memory and loads its real prompts and answers', async () => {
    const lookup = mockCoupleDropLookup('cd-92');
    const { result } = await renderHook(() => useOnThisDay());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.memory?.date).toBe('2026-06-28');
    expect(result.current.memory?.title).toBe('the deep end');
    expect(result.current.memory?.wavelength).toBe(92);

    // The couple_drop is resolved by (couple, date) and fed to fetchReveal.
    expect(mockFrom).toHaveBeenCalledWith('couple_drops');
    expect(lookup.eqCouple).toHaveBeenCalledWith('couple_id', 'c1');
    expect(lookup.eqDate).toHaveBeenCalledWith('date', '2026-06-28');
    expect(mockFetchReveal).toHaveBeenCalledWith('cd-92');

    expect(result.current.prompts).toEqual(PROMPTS);
    expect(result.current.answers).toEqual(ANSWERS);
  });

  it('returns a null memory (empty state) for a couple with no revealed history', async () => {
    mockUseCoupleHistory.mockReturnValue({ history: [], loading: false, isSample: false, error: null });
    const { result } = await renderHook(() => useOnThisDay());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.memory).toBeNull();
    expect(result.current.prompts).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockFetchReveal).not.toHaveBeenCalled();
  });

  it('never surfaces the demo sample as a memory when unauthenticated', async () => {
    mockUseSession.mockReturnValue({ session: null, loading: false });
    mockUseCouple.mockReturnValue({ couple: null, loading: false, status: 'none' });
    mockUseCoupleHistory.mockReturnValue({
      history: HISTORY, // useCoupleHistory serves the static sample here
      loading: false,
      isSample: true,
      error: null,
    });

    const { result } = await renderHook(() => useOnThisDay());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.memory).toBeNull();
    expect(mockFetchReveal).not.toHaveBeenCalled();
  });

  it('keeps the memory but no answers when the reveal fetch fails', async () => {
    mockCoupleDropLookup('cd-92');
    mockFetchReveal.mockRejectedValue(new Error('offline'));

    const { result } = await renderHook(() => useOnThisDay());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.memory?.title).toBe('the deep end');
    expect(result.current.prompts).toEqual([]);
    expect(result.current.answers).toEqual([]);
  });
});
