import { render, act, fireEvent } from '@testing-library/react-native';

let mockSession: object | null = null;
let mockCouple: { id: string } | null = null;
jest.mock('../../src/features/auth/useSession', () => ({
  useSession: () => ({ session: mockSession, loading: false }),
}));
jest.mock('../../src/features/pairing/useCouple', () => ({
  useCouple: () => ({ couple: mockCouple, loading: false, status: mockCouple ? 'active' : 'none' }),
}));

const mockToday: { today: object | null; content: object | null; loading: boolean } = {
  today: null,
  content: null,
  loading: false,
};
jest.mock('../../src/features/drops/useTodayState', () => ({
  useTodayState: () => ({ ...mockToday, refresh: jest.fn() }),
}));

const mockSubmit = jest.fn();
jest.mock('../../src/features/drops/dropActions', () => ({
  submitMyAnswers: (...a: unknown[]) => mockSubmit(...a),
  ensureYesterdayDrop: jest.fn(),
  getDropContent: jest.fn(),
}));

const mockFireToast = jest.fn();
jest.mock('../../src/store/ui', () => ({
  useUiStore: { getState: () => ({ fireToast: mockFireToast }) },
}));

import PlayScreen from '../play';
import { usePlayStore } from '../../src/store/play';

const LIVE_CONTENT = {
  code: 'W9',
  title: 'the current',
  prompts: [
    { id: 'p1', emoji: '☕', q: 'first thing on a slow morning?', opts: ['coffee', 'cuddle', 'phone'] },
  ],
};

describe('Play Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = null;
    mockCouple = null;
    mockToday.today = null;
    mockToday.content = null;
    mockToday.loading = false;
  });

  it('renders the first prompt with its options (demo mode)', async () => {
    const { getByText } = await render(<PlayScreen />);
    expect(getByText('I feel most taken care of when you...')).toBeTruthy();
    expect(getByText('bring me a drink before I ask')).toBeTruthy();
  });

  it('live: holds on "loading today\'s drop…" until the assigned content arrives — never the static demo (4.1)', async () => {
    mockSession = { user: { id: 'me' } };
    mockCouple = { id: 'c1' };
    mockToday.content = null;

    const { getByText, queryByText } = await render(<PlayScreen />);

    expect(getByText("loading today's drop…")).toBeTruthy();
    expect(queryByText('I feel most taken care of when you...')).toBeNull();
  });

  it('live: a failed submit fires the honest toast and keeps the answers on screen for a retry (4.1)', async () => {
    mockSession = { user: { id: 'me' } };
    mockCouple = { id: 'c1' };
    mockToday.content = LIVE_CONTENT;
    mockToday.today = { exists: true, couple_drop_id: 'cd-1', state: 'open' };
    mockSubmit.mockRejectedValue(new Error('offline'));

    const { getByText } = await render(<PlayScreen />);

    // pick → (360ms phase advance, 420ms tap lock) → hunch = final submit
    await act(async () => {
      fireEvent.press(getByText('coffee'));
      await new Promise((r) => setTimeout(r, 450));
    });
    await act(async () => {
      fireEvent.press(getByText('cuddle'));
      await new Promise((r) => setTimeout(r, 450));
    });

    expect(mockSubmit).toHaveBeenCalledWith('c1', [0, null, null], [1, null, null], {
      catchUp: false,
      coupleDropId: 'cd-1',
    });
    expect(mockFireToast).toHaveBeenCalledWith(
      "Couldn't send your answers — check your connection and tap again"
    );
    // Still on the play screen with the question up — nothing pretended to land.
    expect(getByText('first thing on a slow morning?')).toBeTruthy();
    expect(usePlayStore.getState().done).toBe(false);
  });
});
