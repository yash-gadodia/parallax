import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import JourneyScreen from '../journey';
import type { JourneyState } from '../../src/types/db';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  __esModule: true,
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
    dismiss: jest.fn(),
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => ({}),
}));

const mockFireToast = jest.fn();
jest.mock('../../src/store/ui', () => ({
  useUiStore: { getState: () => ({ fireToast: mockFireToast }) },
}));

jest.mock('../../src/features/auth/useSession', () => ({ useSession: jest.fn() }));
jest.mock('../../src/features/pairing/useCouple', () => ({ useCouple: jest.fn() }));
jest.mock('../../src/features/profile/useIdentity', () => ({ useIdentity: jest.fn() }));
jest.mock('../../src/features/journeys/useJourneyState', () => ({
  useJourneyState: jest.fn(),
}));
jest.mock('../../src/features/journeys/journeyActions', () => ({
  recordJourneyCheckin: jest.fn(),
  advanceJourneyStage: jest.fn(),
}));

import { useSession } from '../../src/features/auth/useSession';
import { useCouple } from '../../src/features/pairing/useCouple';
import { useIdentity } from '../../src/features/profile/useIdentity';
import { useJourneyState } from '../../src/features/journeys/useJourneyState';
import {
  recordJourneyCheckin,
  advanceJourneyStage,
} from '../../src/features/journeys/journeyActions';

const mockUseSession = useSession as jest.Mock;
const mockUseCouple = useCouple as jest.Mock;
const mockUseIdentity = useIdentity as jest.Mock;
const mockUseJourneyState = useJourneyState as jest.Mock;
const mockCheckin = recordJourneyCheckin as jest.Mock;
const mockAdvance = advanceJourneyStage as jest.Mock;

const STAGE_TITLES = [
  'ballot szn',
  'queue number reveal',
  'the long wait',
  'money talks',
  'keys day',
  'the reno arc',
  'move-in night',
];

const STAGES = STAGE_TITLES.map((title, i) => ({
  id: `s${i + 1}`,
  journey_id: 'j1',
  position: i + 1,
  emoji: '🎲',
  title,
  kick: `kick ${i + 1}`,
  description: `description ${i + 1}`,
  talk_prompts: [
    { emoji: '🗺', text: `talk about thing ${i + 1}` },
    { emoji: '⏳', text: `and also thing ${i + 1}b` },
    { emoji: '🅱️', text: `and thing ${i + 1}c` },
  ],
  checkin_prompt: `check in question ${i + 1}?`,
  theme: null,
  created_at: '2026-06-01T00:00:00Z',
}));

function liveState(overrides: Partial<JourneyState> = {}): JourneyState {
  return {
    exists: true,
    couple_journey_id: 'cj1',
    journey_id: 'j1',
    slug: 'bto',
    title: 'the bto journey',
    emoji: '🏠',
    stage_count: 7,
    current_stage: 1,
    started_at: '2026-06-01T00:00:00Z',
    completed_at: null,
    i_checked_in: false,
    partner_checked_in: false,
    stages: [],
    ...overrides,
  };
}

function mockJourney({
  state = liveState() as JourneyState | null,
  stages = STAGES,
  loading = false,
  error = null as Error | null,
  refetch = jest.fn(),
} = {}) {
  mockUseJourneyState.mockReturnValue({ state, stages, loading, error, refetch });
  return { refetch };
}

describe('Journey screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({ session: { user: { id: 'u1' } }, loading: false });
    mockUseCouple.mockReturnValue({ couple: { id: 'c1' }, loading: false });
    mockUseIdentity.mockReturnValue({
      me: { name: 'Alex', initial: 'A' },
      partner: { name: 'Jordan', initial: 'J', hasPartner: true },
      loading: false,
    });
  });

  it('holds a skeleton during a live cold start (4.1)', async () => {
    mockJourney({ loading: true, state: null, stages: [] });
    const { getByTestId, queryByText } = await render(<JourneyScreen />);
    expect(getByTestId('journey-skeleton')).toBeTruthy();
    expect(queryByText('the bto journey')).toBeNull();
  });

  it('shows an honest, retryable error state', async () => {
    const { refetch } = mockJourney({ error: new Error('down'), state: null, stages: [] });
    const { getByText } = await render(<JourneyScreen />);
    expect(
      getByText("couldn't reach your journey right now — your place is safe, try again in a bit.")
    ).toBeTruthy();
    fireEvent.press(getByText('try again'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('offers the browse CTA when the couple has no journey yet', async () => {
    mockJourney({ state: { exists: false }, stages: [] });
    const { getByText } = await render(<JourneyScreen />);
    expect(getByText('no journey yet')).toBeTruthy();
    fireEvent.press(getByText('Browse journeys →'));
    expect(mockPush).toHaveBeenCalledWith('/journeys');
  });

  it('renders the current stage with its talk prompts and check-in question', async () => {
    mockJourney();
    const { getByText, getAllByText } = await render(<JourneyScreen />);

    expect(getByText('the bto journey')).toBeTruthy();
    expect(getByText('stage 1 of 7')).toBeTruthy();
    // Once in the stage card, once in the whole-track list.
    expect(getAllByText('ballot szn').length).toBe(2);
    expect(getByText('description 1')).toBeTruthy();
    expect(getByText('talk about thing 1')).toBeTruthy();
    expect(getByText('check in question 1?')).toBeTruthy();
    expect(getByText('Check in on this stage')).toBeTruthy();
  });

  it('gates the advance button until a check-in exists — mirroring the server', async () => {
    mockJourney();
    const { getByText } = await render(<JourneyScreen />);

    expect(getByText('check in first — then this unlocks')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByText("We've moved on → next stage"));
    });
    expect(mockAdvance).not.toHaveBeenCalled();
  });

  it('records a check-in with the typed note', async () => {
    mockCheckin.mockResolvedValue(undefined);
    mockJourney();
    const { getByText, getByLabelText } = await render(<JourneyScreen />);

    await act(async () => {
      fireEvent.changeText(getByLabelText('Check-in note'), '  ballot went in today  ');
    });
    await act(async () => {
      fireEvent.press(getByText('Check in on this stage'));
    });

    await waitFor(() =>
      expect(mockCheckin).toHaveBeenCalledWith('cj1', 'ballot went in today')
    );
  });

  it('advances once checked in, and shows who checked in', async () => {
    mockAdvance.mockResolvedValue({ current_stage: 2, completed: false });
    mockJourney({ state: liveState({ i_checked_in: true }) });
    const { getByText, queryByText } = await render(<JourneyScreen />);

    expect(getByText('you checked in ✓ · Jordan can add theirs anytime')).toBeTruthy();
    expect(queryByText('Check in on this stage')).toBeNull();

    await act(async () => {
      fireEvent.press(getByText("We've moved on → next stage"));
    });

    await waitFor(() => expect(mockAdvance).toHaveBeenCalledWith('cj1'));
  });

  it("a quiet partner never dead-ends the journey — the partner's check-in unlocks advance", async () => {
    mockAdvance.mockResolvedValue({ current_stage: 2, completed: false });
    mockJourney({ state: liveState({ partner_checked_in: true }) });
    const { getByText } = await render(<JourneyScreen />);

    expect(getByText('Jordan checked in ✓ · add yours, or move on together')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByText("We've moved on → next stage"));
    });
    await waitFor(() => expect(mockAdvance).toHaveBeenCalledWith('cj1'));
  });

  it("surfaces the server's check-in gate warmly when advance loses the race (stale local flag)", async () => {
    // Locally advanceable (i_checked_in true) but the server says otherwise —
    // e.g. the check-in state changed under us. The specific reason must
    // surface, not the generic try-again.
    mockAdvance.mockRejectedValue(new Error('check in on this stage before moving on'));
    const { refetch } = mockJourney({ state: liveState({ i_checked_in: true }) });
    const { getByText } = await render(<JourneyScreen />);

    await act(async () => {
      fireEvent.press(getByText("We've moved on → next stage"));
    });

    await waitFor(() =>
      expect(mockFireToast).toHaveBeenCalledWith(
        'check in on this stage first — then it unlocks'
      )
    );
    // The screen resyncs so the gate state matches the server again.
    expect(refetch).toHaveBeenCalled();
  });

  it('keeps the generic warm failure for any other advance error', async () => {
    mockAdvance.mockRejectedValue(new Error('network down'));
    mockJourney({ state: liveState({ i_checked_in: true }) });
    const { getByText } = await render(<JourneyScreen />);

    await act(async () => {
      fireEvent.press(getByText("We've moved on → next stage"));
    });

    await waitFor(() =>
      expect(mockFireToast).toHaveBeenCalledWith(
        "couldn't move the stage — try again in a bit"
      )
    );
  });

  it('labels the final stage advance as finishing the journey', async () => {
    mockJourney({ state: liveState({ current_stage: 7, i_checked_in: true }) });
    const { getByText, getAllByText } = await render(<JourneyScreen />);
    // Once in the stage card, once in the whole-track list.
    expect(getAllByText('move-in night').length).toBe(2);
    expect(getByText('Finish the journey 🎉')).toBeTruthy();
  });

  it('celebrates a completed journey', async () => {
    mockJourney({
      state: liveState({
        current_stage: 7,
        completed_at: '2026-07-01T00:00:00Z',
        i_checked_in: true,
        partner_checked_in: true,
      }),
    });
    const { getByText, queryByText } = await render(<JourneyScreen />);
    expect(getByText('you walked the whole thing')).toBeTruthy();
    expect(getByText('complete')).toBeTruthy();
    expect(queryByText('Check in on this stage')).toBeNull();
  });

  it('demo mode: previews the sample stage, clearly labelled, with no live actions', async () => {
    mockUseSession.mockReturnValue({ session: null, loading: false });
    mockUseCouple.mockReturnValue({ couple: null, loading: false });
    mockJourney({ state: null, stages: [] });

    const { getByText, getAllByText, queryByText } = await render(<JourneyScreen />);

    expect(getByText('sample preview · pair up to walk it for real')).toBeTruthy();
    expect(getByText('the bto journey')).toBeTruthy();
    // The sample sits mid-journey at stage 3: the long wait — once in the
    // stage card, once in the whole-track list.
    expect(getByText('stage 3 of 7')).toBeTruthy();
    expect(getAllByText('the long wait').length).toBe(2);
    expect(queryByText('Check in on this stage')).toBeNull();
    expect(getByText('Make it yours →')).toBeTruthy();

    fireEvent.press(getByText('Make it yours →'));
    expect(mockPush).toHaveBeenCalledWith('/signup');
  });
});
