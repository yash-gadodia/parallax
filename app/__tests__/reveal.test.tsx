import { render, act } from '@testing-library/react-native';

// fetchReveal is only called in server path; mock it so we can control its output
jest.mock('../../src/features/drops/dropActions', () => ({
  fetchReveal: jest.fn(),
}));

// Configurable session/couple mocks so we can switch between demo and server modes
let mockSession: object | null = null;
let mockCouple: object | null = null;

jest.mock('../../src/features/auth/useSession', () => ({
  useSession: () => ({ session: mockSession, loading: false }),
}));
jest.mock('../../src/features/pairing/useCouple', () => ({
  useCouple: () => ({ couple: mockCouple, loading: false, status: mockCouple ? 'active' : 'none' }),
}));

import RevealScreen from '../reveal';
import { fetchReveal } from '../../src/features/drops/dropActions';
import { usePlayStore } from '../../src/store/play';

const mockFetchReveal = fetchReveal as jest.Mock;

describe('Reveal Screen — demo mode (no session)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = null;
    mockCouple = null;
    usePlayStore.setState({
      myPicks: [null, null, null],
      myHunches: [null, null, null],
      coupleDropId: null,
      done: false,
      idx: 0,
      phase: 'pick',
    });
  });

  it('renders the prompt and a non-empty YOU answer chip using demo data', async () => {
    const { getByText } = await render(<RevealScreen />);
    expect(getByText('I feel most taken care of when you...')).toBeTruthy();
    // 'low' prompt youDemo=3 -> opts[3] = 'to be pulled out of my head'
    expect(getByText('to be pulled out of my head')).toBeTruthy();
  });

  it('does NOT call fetchReveal when there is no session', async () => {
    await render(<RevealScreen />);
    await act(async () => {});
    expect(mockFetchReveal).not.toHaveBeenCalled();
  });

  it('does NOT call fetchReveal when session exists but coupleDropId is null', async () => {
    mockSession = { user: { id: 'me' } };
    mockCouple = { id: 'couple-1', member_a: 'me', member_b: 'them' };
    usePlayStore.setState({ coupleDropId: null });

    await render(<RevealScreen />);
    await act(async () => {});
    expect(mockFetchReveal).not.toHaveBeenCalled();
  });
});

describe('Reveal Screen — server mode (session + couple + coupleDropId)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = { user: { id: 'me' } };
    mockCouple = { id: 'couple-1', member_a: 'me', member_b: 'them' };
    usePlayStore.setState({
      myPicks: [null, null, null],
      myHunches: [null, null, null],
      coupleDropId: 'cd-42',
      done: true,
      idx: 0,
      phase: 'pick',
    });
    mockFetchReveal.mockResolvedValue({
      state: 'revealed',
      reveal: { yourHits: 1, theirHits: 1, twins: 1, wave: 67 },
      promptAnswers: [
        { youPick: 0, youHunch: 1, themPick: 0, themHunch: 0 },
        { youPick: 2, youHunch: 0, themPick: 1, themHunch: 2 },
        { youPick: 3, youHunch: 1, themPick: 3, themHunch: 1 },
      ],
    });
  });

  it('calls fetchReveal with the coupleDropId from the store', async () => {
    await render(<RevealScreen />);
    await act(async () => {});
    expect(mockFetchReveal).toHaveBeenCalledWith('cd-42');
  });

  it('renders the wave% from the server reveal, not local computation', async () => {
    const { getAllByText } = await render(<RevealScreen />);
    await act(async () => {});
    // server reveal says 67% — GradientText renders the string twice (mask + opacity-0 copy)
    expect(getAllByText('67%').length).toBeGreaterThan(0);
  });
});
