import { render, fireEvent } from '@testing-library/react-native';
import TodayScreen from '../(tabs)/today';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  __esModule: true,
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn(), navigate: jest.fn(), dismiss: jest.fn() }),
  useLocalSearchParams: () => ({}),
  useFocusEffect: () => {},
}));

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
// Keep the REAL pure helpers (stageProgressLabel via journeyLogic) — only the
// server hook is faked.
jest.mock('../../src/features/journeys/useJourneyState', () => ({
  useJourneyState: jest.fn(),
}));

import { useCouple } from '../../src/features/pairing/useCouple';
import { useSession } from '../../src/features/auth/useSession';
import { useTodayState } from '../../src/features/drops/useTodayState';
import { useCoupleHistory } from '../../src/features/lovemap/useCoupleHistory';
import { useActivity } from '../../src/features/engagement/useActivity';
import { useIdentity } from '../../src/features/profile/useIdentity';
import { useJourneyState } from '../../src/features/journeys/useJourneyState';

const mockUseCouple = useCouple as jest.Mock;
const mockUseSession = useSession as jest.Mock;
const mockUseTodayState = useTodayState as jest.Mock;
const mockUseCoupleHistory = useCoupleHistory as jest.Mock;
const mockUseActivity = useActivity as jest.Mock;
const mockUseIdentity = useIdentity as jest.Mock;
const mockUseJourneyState = useJourneyState as jest.Mock;

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
  catchUp = false,
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
      catch_up_available: catchUp,
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
  'streak rule: you both play, it grows. miss a day? catch it up by midnight, or a freeze saves you — you have 2.';

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
    mockUseJourneyState.mockReturnValue({
      state: null,
      stages: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it('holds the drop card with a skeleton during a live cold start — never the demo content (4.1)', async () => {
    mockLive({});
    mockUseTodayState.mockReturnValue({
      today: null,
      content: null,
      loading: true,
      refresh: jest.fn(),
    });

    const { getByTestId, queryByText } = await render(<TodayScreen now={() => MORNING} />);

    expect(getByTestId('today-card-skeleton')).toBeTruthy();
    expect(queryByText("Play today's three")).toBeNull();
    expect(queryByText('soft launch')).toBeNull();
  });

  it('offers the catch-up card when the server says yesterday is still open (0021)', async () => {
    mockLive({ catchUp: true });
    const { getByText } = await render(<TodayScreen now={() => MORNING} />);
    expect(getByText('Yesterday got away? Catch it up')).toBeTruthy();
    expect(getByText('open till midnight · scored at 80% · saves your streak')).toBeTruthy();
  });

  it('routes the catch-up card into play in catch-up mode', async () => {
    mockLive({ catchUp: true });
    const { getByText } = await render(<TodayScreen now={() => MORNING} />);
    fireEvent.press(getByText('Yesterday got away? Catch it up'));
    expect(mockPush).toHaveBeenCalledWith('/play?catchup=1');
  });

  it('never guilt-trips: no catch-up card when yesterday is done or the couple is new', async () => {
    mockLive({ catchUp: false });
    const { queryByText } = await render(<TodayScreen now={() => MORNING} />);
    expect(queryByText('Yesterday got away? Catch it up')).toBeNull();
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
    // (c) the solo practice round, clearly marked as never sent
    expect(getByText('practice reading Jordan 🎯')).toBeTruthy();
    expect(getByText('guess their past answers · nothing is sent')).toBeTruthy();
  });

  it('routes the practice row to /practice', async () => {
    mockLive({
      streak: 3,
      createdDaysAgo: 30,
      iAnswered: true,
      partnerAnswered: false,
      state: 'one_done',
      history: [HISTORY_ROW],
      now: EVENING,
    });

    const { getByText } = await render(<TodayScreen now={() => EVENING} />);
    fireEvent.press(getByText('practice reading Jordan 🎯'));
    expect(mockPush).toHaveBeenCalledWith('/practice');
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
    expect(queryByText('practice reading Jordan 🎯')).toBeNull();
  });

  it('leads the revealed teaser with the story; the wave% stays but is demoted', async () => {
    mockLive({
      streak: 5,
      createdDaysAgo: 30,
      iAnswered: true,
      partnerAnswered: true,
      state: 'revealed',
    });

    const { getByText, getAllByText, queryByText } = await render(
      <TodayScreen now={() => MORNING} />
    );

    // Story leads
    expect(getByText('round complete · you both played')).toBeTruthy();
    expect(getByText('see how you read each other')).toBeTruthy();
    // wave% is still present (80 from the mock) — now labelled + demoted, no longer the headline
    expect(getByText('wavelength')).toBeTruthy();
    expect(getAllByText('80%').length).toBeGreaterThan(0);
    expect(getByText('See the reveal →')).toBeTruthy();
    // the old score-first headline copy is gone
    expect(queryByText('on the same wavelength')).toBeNull();
  });

  it('shows the quiet journey discovery row when no journey is active, routing to /journeys', async () => {
    mockLive({});
    const { getByText } = await render(<TodayScreen now={() => MORNING} />);

    expect(getByText('Milestone journeys')).toBeTruthy();
    expect(
      getByText('the bto journey is here · walk the big eras together')
    ).toBeTruthy();

    fireEvent.press(getByText('Milestone journeys'));
    expect(mockPush).toHaveBeenCalledWith('/journeys');
  });

  it('shows the active journey with its stage marker, routing to /journey', async () => {
    mockLive({});
    mockUseJourneyState.mockReturnValue({
      state: {
        exists: true,
        couple_journey_id: 'cj1',
        journey_id: 'j1',
        slug: 'bto',
        title: 'the bto journey',
        emoji: '🏠',
        stage_count: 7,
        current_stage: 3,
        completed_at: null,
        i_checked_in: false,
        partner_checked_in: false,
      },
      stages: [
        { id: 's3', journey_id: 'j1', position: 3, title: 'the long wait' },
      ],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByText, queryByText } = await render(<TodayScreen now={() => MORNING} />);

    expect(getByText('the bto journey')).toBeTruthy();
    expect(getByText('stage 3 of 7 · the long wait')).toBeTruthy();
    expect(queryByText('Milestone journeys')).toBeNull();

    fireEvent.press(getByText('the bto journey'));
    expect(mockPush).toHaveBeenCalledWith('/journey');
  });

  it('rests a completed journey back to the discovery row', async () => {
    mockLive({});
    mockUseJourneyState.mockReturnValue({
      state: {
        exists: true,
        couple_journey_id: 'cj1',
        journey_id: 'j1',
        slug: 'bto',
        title: 'the bto journey',
        emoji: '🏠',
        stage_count: 7,
        current_stage: 7,
        completed_at: '2026-07-01T00:00:00Z',
        i_checked_in: true,
        partner_checked_in: true,
      },
      stages: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByText, queryByText } = await render(<TodayScreen now={() => MORNING} />);

    expect(getByText('Milestone journeys')).toBeTruthy();
    expect(queryByText('stage 7 of 7')).toBeNull();
  });

  it('skips the archive and practice rows (but keeps the nudge) when the couple has no history yet', async () => {
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
    expect(queryByText('practice reading Jordan 🎯')).toBeNull();
    expect(getByText('send Jordan a nudge')).toBeTruthy();
  });
});
