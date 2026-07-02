import { render } from '@testing-library/react-native';
import TodayScreen from '../(tabs)/today';

jest.mock('../../src/features/pairing/useCouple', () => ({
  useCouple: jest.fn(),
}));
jest.mock('../../src/features/auth/useSession', () => ({
  useSession: jest.fn(),
}));
// Keep the REAL pure helpers (coupleAgeDays, firstWeekBeat, …) — only the
// server hook is faked.
jest.mock('../../src/features/drops/useTodayState', () => ({
  ...jest.requireActual('../../src/features/drops/useTodayState'),
  useTodayState: jest.fn(),
}));
jest.mock('../../src/features/lovemap/useCoupleHistory', () => ({
  useCoupleHistory: jest.fn(),
}));
jest.mock('../../src/features/engagement/useActivity', () => ({
  useActivity: jest.fn(),
}));
jest.mock('../../src/features/profile/useIdentity', () => ({
  useIdentity: jest.fn(),
}));

import { useCouple } from '../../src/features/pairing/useCouple';
import { useSession } from '../../src/features/auth/useSession';
import { useTodayState } from '../../src/features/drops/useTodayState';
import { useCoupleHistory } from '../../src/features/lovemap/useCoupleHistory';
import { useActivity } from '../../src/features/engagement/useActivity';
import { useIdentity } from '../../src/features/profile/useIdentity';

const mockUseCouple = useCouple as jest.Mock;
const mockUseSession = useSession as jest.Mock;
const mockUseTodayState = useTodayState as jest.Mock;
const mockUseCoupleHistory = useCoupleHistory as jest.Mock;
const mockUseActivity = useActivity as jest.Mock;
const mockUseIdentity = useIdentity as jest.Mock;

// Injectable clock: a quiet Thursday morning unless a test says otherwise.
const MORNING = new Date(2026, 6, 2, 10, 0, 0);
const EVENING = new Date(2026, 6, 2, 20, 0, 0);
const daysBefore = (d: Date, days: number) => new Date(d.getTime() - days * 86400000);

const HISTORY_ROW = {
  date: '2026-06-28',
  code: 'W2',
  title: 'the deep end',
  wavelength: 92,
  twins_count: 2,
};

function mockLive({
  streak = 1,
  freezes = 2,
  createdDaysAgo = 1,
  iAnswered = false,
  partnerAnswered = false,
  state = 'open' as 'open' | 'one_done' | 'revealed',
  history = [] as (typeof HISTORY_ROW)[],
  now = MORNING,
} = {}) {
  mockUseSession.mockReturnValue({ session: { user: { id: 'u1' } }, loading: false });
  mockUseCouple.mockReturnValue({
    couple: {
      id: 'c1',
      status: 'active',
      invite_code: 'ABCD-1234',
      streak,
      freezes_remaining: freezes,
      created_at: daysBefore(now, createdDaysAgo).toISOString(),
    },
    status: 'active',
    loading: false,
  });
  mockUseTodayState.mockReturnValue({
    today: {
      exists: true,
      date: '2026-07-02',
      couple_drop_id: 'cd1',
      state,
      wave_pct: state === 'revealed' ? 80 : null,
      i_answered: iAnswered,
      partner_answered: partnerAnswered,
    },
    content: null,
    loading: false,
    refresh: jest.fn(),
  });
  mockUseCoupleHistory.mockReturnValue({
    history,
    loading: false,
    isSample: false,
    error: null,
  });
}

const STREAK_RULE_LINE =
  'streak rule: you both play, it grows. miss a day, it resets — you have 2 freezes.';

describe('Today Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({ session: null, loading: false });
    mockUseCouple.mockReturnValue({ couple: null, status: 'none', loading: false });
    mockUseTodayState.mockReturnValue({ today: null, content: null, loading: false, refresh: jest.fn() });
    mockUseCoupleHistory.mockReturnValue({ history: [], loading: false, isSample: true, error: null });
    mockUseActivity.mockReturnValue({ items: [], unreadCount: 0, loading: false, markAllRead: jest.fn() });
    mockUseIdentity.mockReturnValue({
      me: { name: 'Alex', initial: 'A' },
      partner: { name: 'Jordan', initial: 'J', hasPartner: true },
      loading: false,
    });
  });

  it('renders the daily drop and the play CTA', async () => {
    const { getByText } = await render(<TodayScreen now={() => MORNING} />);
    expect(getByText('soft launch')).toBeTruthy();
    expect(getByText("Play today's three")).toBeTruthy();
  });

  it('shows the invite-ahead banner (not a partner-played ping) while pairing is pending', async () => {
    mockUseCouple.mockReturnValue({
      couple: { id: 'c1', status: 'pending', invite_code: 'ABCD-1234', streak: 0 },
      status: 'pending',
      loading: false,
    });

    const { getByText, queryByText } = await render(<TodayScreen now={() => MORNING} />);

    expect(getByText('Invite your partner to pair')).toBeTruthy();
    expect(getByText("answer ahead · they'll see it when they join")).toBeTruthy();
    // The fake "partner already played" ping must NOT show when there is no partner.
    expect(queryByText('Jordan already played today')).toBeNull();
    // They can still answer their own half ahead of time.
    expect(getByText("Play today's three")).toBeTruthy();
  });

  it('shows the streak-rule one-liner exactly at streak 1', async () => {
    mockLive({ streak: 1, freezes: 2, createdDaysAgo: 1 });

    const { getByText } = await render(<TodayScreen now={() => MORNING} />);

    expect(getByText(STREAK_RULE_LINE)).toBeTruthy();
  });

  it('does not show the streak-rule line at streak 2', async () => {
    mockLive({ streak: 2, freezes: 2, createdDaysAgo: 1 });

    const { queryByText } = await render(<TodayScreen now={() => MORNING} />);

    expect(queryByText(STREAK_RULE_LINE)).toBeNull();
  });

  it('shows the one-week banner for a 7-day-old couple with streak 7', async () => {
    mockLive({ streak: 7, createdDaysAgo: 7 });

    const { getByText } = await render(<TodayScreen now={() => MORNING} />);

    expect(getByText('one week of you two 🎉')).toBeTruthy();
    expect(getByText('see your first week →')).toBeTruthy();
  });

  it('shows no week banner on day 8, even with the streak intact', async () => {
    mockLive({ streak: 8, createdDaysAgo: 8 });

    const { queryByText } = await render(<TodayScreen now={() => MORNING} />);

    expect(queryByText('one week of you two 🎉')).toBeNull();
  });

  it('offers while-you-wait solo value in the evening when only I have answered', async () => {
    mockLive({
      streak: 3,
      createdDaysAgo: 30, // outside the first-week window: no beat in play
      iAnswered: true,
      partnerAnswered: false,
      state: 'one_done',
      history: [HISTORY_ROW],
      now: EVENING,
    });

    const { getByText } = await render(<TodayScreen now={() => EVENING} />);

    expect(getByText('Waiting on Jordan — the reveal unlocks the moment they play.')).toBeTruthy();
    expect(getByText('while you wait')).toBeTruthy();
    // (a) the archive moment, because history exists
    expect(getByText('remember this one?')).toBeTruthy();
    expect(getByText('revisit a favorite reveal from your story')).toBeTruthy();
    // (b) the nudge affordance, warm and pressure-free
    expect(getByText('send Jordan a nudge')).toBeTruthy();
    expect(getByText('a soft hello — zero pressure')).toBeTruthy();
  });

  it('keeps the plain waiting card in the morning (no while-you-wait push)', async () => {
    mockLive({
      streak: 3,
      createdDaysAgo: 30,
      iAnswered: true,
      partnerAnswered: false,
      state: 'one_done',
      history: [HISTORY_ROW],
      now: MORNING,
    });

    const { getByText, queryByText } = await render(<TodayScreen now={() => MORNING} />);

    expect(getByText('Waiting on Jordan — the reveal unlocks the moment they play.')).toBeTruthy();
    expect(queryByText('while you wait')).toBeNull();
    expect(queryByText('send Jordan a nudge')).toBeNull();
  });

  it('skips the archive row (but keeps the nudge) when the couple has no history yet', async () => {
    mockLive({
      streak: 3,
      createdDaysAgo: 30,
      iAnswered: true,
      partnerAnswered: false,
      state: 'one_done',
      history: [],
      now: EVENING,
    });

    const { getByText, queryByText } = await render(<TodayScreen now={() => EVENING} />);

    expect(queryByText('remember this one?')).toBeNull();
    expect(getByText('send Jordan a nudge')).toBeTruthy();
  });
});
