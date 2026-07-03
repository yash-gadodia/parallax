import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import JourneysScreen from '../journeys';

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  __esModule: true,
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: mockBack,
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
jest.mock('../../src/features/journeys/useJourneys', () => ({ useJourneys: jest.fn() }));
jest.mock('../../src/features/journeys/useJourneyState', () => ({
  useJourneyState: jest.fn(),
}));
jest.mock('../../src/features/journeys/journeyActions', () => ({
  enrollJourney: jest.fn(),
}));

import { useSession } from '../../src/features/auth/useSession';
import { useCouple } from '../../src/features/pairing/useCouple';
import { useJourneys } from '../../src/features/journeys/useJourneys';
import { useJourneyState } from '../../src/features/journeys/useJourneyState';
import { enrollJourney } from '../../src/features/journeys/journeyActions';

const mockUseSession = useSession as jest.Mock;
const mockUseCouple = useCouple as jest.Mock;
const mockUseJourneys = useJourneys as jest.Mock;
const mockUseJourneyState = useJourneyState as jest.Mock;
const mockEnrollJourney = enrollJourney as jest.Mock;

const BTO = {
  id: 'j1',
  slug: 'bto',
  title: 'the bto journey',
  emoji: '🏠',
  tagline: 'from ballot night to your first morning in it',
  description: 'the whole arc, a stage at a time.',
  stageCount: 7,
};

function mockCatalog({
  journeys = [BTO],
  loading = false,
  isSample = false,
  error = null as Error | null,
  refetch = jest.fn(),
} = {}) {
  mockUseJourneys.mockReturnValue({ journeys, loading, isSample, error, refetch });
  return { refetch };
}

describe('Journeys browse screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({ session: { user: { id: 'u1' } }, loading: false });
    mockUseCouple.mockReturnValue({ couple: { id: 'c1' }, loading: false });
    mockUseJourneyState.mockReturnValue({
      state: null,
      stages: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it('shows the loading skeleton while the catalog loads (4.1)', async () => {
    mockCatalog({ loading: true, journeys: [] });
    const { getByTestId, queryByText } = await render(<JourneysScreen />);
    expect(getByTestId('journeys-skeleton')).toBeTruthy();
    expect(queryByText('the bto journey')).toBeNull();
  });

  it('shows an honest, retryable error state', async () => {
    const { refetch } = mockCatalog({ error: new Error('down'), journeys: [] });
    const { getByText } = await render(<JourneysScreen />);
    expect(
      getByText("couldn't reach the journeys right now — nothing's lost, try again in a bit.")
    ).toBeTruthy();
    fireEvent.press(getByText('try again'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('shows the warm empty state when no journeys are live yet', async () => {
    mockCatalog({ journeys: [] });
    const { getByText } = await render(<JourneysScreen />);
    expect(
      getByText('journeys are still being written — the first one lands here soon.')
    ).toBeTruthy();
  });

  it('renders the BTO journey card with its stage count', async () => {
    mockCatalog();
    const { getByText } = await render(<JourneysScreen />);
    expect(getByText('the bto journey')).toBeTruthy();
    expect(getByText('from ballot night to your first morning in it')).toBeTruthy();
    expect(getByText('7 stages · move at your own pace')).toBeTruthy();
    expect(getByText('Start this journey')).toBeTruthy();
  });

  it('enrolls on start and opens the journey', async () => {
    mockCatalog();
    mockEnrollJourney.mockResolvedValue('cj1');
    const { getByText } = await render(<JourneysScreen />);

    await act(async () => {
      fireEvent.press(getByText('Start this journey'));
    });

    await waitFor(() => expect(mockEnrollJourney).toHaveBeenCalledWith('c1', 'j1'));
    expect(mockPush).toHaveBeenCalledWith('/journey');
  });

  it('shows the in-progress marker instead of the start button once enrolled', async () => {
    mockCatalog();
    mockUseJourneyState.mockReturnValue({
      state: {
        exists: true,
        couple_journey_id: 'cj1',
        journey_id: 'j1',
        stage_count: 7,
        current_stage: 2,
        completed_at: null,
      },
      stages: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByText, queryByText } = await render(<JourneysScreen />);

    expect(getByText("you're on this one")).toBeTruthy();
    expect(getByText('stage 2 of 7 · open it →')).toBeTruthy();
    expect(queryByText('Start this journey')).toBeNull();

    fireEvent.press(getByText("you're on this one"));
    expect(mockPush).toHaveBeenCalledWith('/journey');
  });

  it('demo mode: labels the sample and previews without enrolling', async () => {
    mockUseSession.mockReturnValue({ session: null, loading: false });
    mockUseCouple.mockReturnValue({ couple: null, loading: false });
    mockCatalog({ isSample: true });

    const { getByText } = await render(<JourneysScreen />);

    expect(getByText('sample preview · pair up to walk one for real')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByText('Start this journey'));
    });

    expect(mockEnrollJourney).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/journey');
  });
});
