import { render, act, fireEvent } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

// fetchReveal is only called in server path; mock it so we can control its output
jest.mock('../../src/features/drops/dropActions', () => ({
  fetchReveal: jest.fn(),
}));

// Haptics: assert the celebration beats without buzzing jest.
jest.mock('../../src/lib/haptics', () => ({
  selection: jest.fn(() => Promise.resolve()),
  lightTick: jest.fn(() => Promise.resolve()),
  success: jest.fn(() => Promise.resolve()),
  celebration: jest.fn(() => Promise.resolve()),
}));

// Reactions hook: controlled per-test (the hook itself has its own co-located test).
let mockReactions: Array<{
  id: string;
  couple_drop_id: string;
  prompt_id: string;
  author: string;
  emoji: string;
  created_at: string;
}> = [];
const mockReact = jest.fn();
jest.mock('../../src/features/reactions/useReactions', () => ({
  REACTION_EMOJIS: ['🥹', '😂', '❤️', '👀'],
  useReactions: jest.fn(() => ({
    reactions: mockReactions,
    myId: 'me',
    loading: false,
    error: null,
    react: mockReact,
  })),
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
import { useReactions } from '../../src/features/reactions/useReactions';
import * as haptics from '../../src/lib/haptics';
import { usePlayStore } from '../../src/store/play';

const mockFetchReveal = fetchReveal as jest.Mock;
const mockUseReactions = useReactions as jest.Mock;

const SERVER_PROMPTS = [
  { id: 'p1', emoji: '☕', question: 'Coffee order?', options: ['A', 'B', 'C', 'D'] },
  { id: 'p2', emoji: '🌧', question: 'Rainy day?', options: ['A', 'B', 'C', 'D'] },
  { id: 'p3', emoji: '🌙', question: 'Late night?', options: ['A', 'B', 'C', 'D'] },
];

describe('Reveal Screen — demo mode (no session)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = null;
    mockCouple = null;
    mockReactions = [];
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

  it('does NOT render reaction rows in demo mode (no real partner to react to)', async () => {
    const { queryAllByText } = await render(<RevealScreen />);
    await act(async () => {});
    expect(queryAllByText('🥹')).toHaveLength(0);
    expect(mockUseReactions).toHaveBeenCalledWith(null);
  });
});

describe('Reveal Screen — server mode (session + couple + coupleDropId)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = { user: { id: 'me' } };
    mockCouple = { id: 'couple-1', member_a: 'me', member_b: 'them' };
    mockReactions = [];
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
      prompts: SERVER_PROMPTS,
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

  it('renders a reaction row under each of the 3 compare cards', async () => {
    const { getAllByText } = await render(<RevealScreen />);
    await act(async () => {});
    expect(getAllByText('🥹')).toHaveLength(3);
    expect(getAllByText('😂')).toHaveLength(3);
    expect(getAllByText('👀')).toHaveLength(3);
    expect(mockUseReactions).toHaveBeenCalledWith('cd-42');
  });

  it("shows the partner's reaction beside the palette when present", async () => {
    mockReactions = [
      {
        id: 'r-1',
        couple_drop_id: 'cd-42',
        prompt_id: 'p1',
        author: 'them',
        emoji: '❤️',
        created_at: '2026-07-02T00:00:00Z',
      },
    ];
    const { getAllByText } = await render(<RevealScreen />);
    await act(async () => {});
    // 3 tappable ❤️ options + 1 partner chip on the p1 card
    expect(getAllByText('❤️')).toHaveLength(4);
  });

  it('tapping a reaction emoji upserts via the hook and fires the light haptic', async () => {
    const { getAllByLabelText } = await render(<RevealScreen />);
    await act(async () => {});

    fireEvent.press(getAllByLabelText('React 😂')[0]);

    expect(mockReact).toHaveBeenCalledTimes(1);
    expect(mockReact).toHaveBeenCalledWith('p1', '😂');
    expect(haptics.selection).toHaveBeenCalledTimes(1);
  });

  it('pops the 👯 badge on exactly the twin-moment cards', async () => {
    const { getAllByText } = await render(<RevealScreen />);
    await act(async () => {});
    // promptAnswers: p1 (0===0) and p3 (3===3) are twins; p2 is not.
    expect(getAllByText('👯')).toHaveLength(2);
  });

  it('renders no sparkle burst below the 70-wave bar', async () => {
    const { queryAllByText } = await render(<RevealScreen />);
    await act(async () => {});
    expect(queryAllByText('✨')).toHaveLength(0);
  });

  it('renders the one-shot sparkle burst when wave >= 70', async () => {
    mockFetchReveal.mockResolvedValue({
      state: 'revealed',
      reveal: { yourHits: 3, theirHits: 2, twins: 2, wave: 83 },
      promptAnswers: [
        { youPick: 0, youHunch: 0, themPick: 0, themHunch: 0 },
        { youPick: 1, youHunch: 1, themPick: 1, themHunch: 1 },
        { youPick: 2, youHunch: 2, themPick: 2, themHunch: 0 },
      ],
      prompts: SERVER_PROMPTS,
    });

    const { getAllByText } = await render(<RevealScreen />);
    await act(async () => {});

    // 12 particles cycling ✨💫⭐️ -> exactly 4 of each
    expect(getAllByText('✨')).toHaveLength(4);
    expect(getAllByText('💫')).toHaveLength(4);
    expect(getAllByText('⭐️')).toHaveLength(4);
  });

  it('skips the sparkle burst entirely when the user prefers reduced motion', async () => {
    (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValueOnce(true);
    mockFetchReveal.mockResolvedValue({
      state: 'revealed',
      reveal: { yourHits: 3, theirHits: 2, twins: 2, wave: 83 },
      promptAnswers: [
        { youPick: 0, youHunch: 0, themPick: 0, themHunch: 0 },
        { youPick: 1, youHunch: 1, themPick: 1, themHunch: 1 },
        { youPick: 2, youHunch: 2, themPick: 2, themHunch: 0 },
      ],
      prompts: SERVER_PROMPTS,
    });

    const { queryAllByText } = await render(<RevealScreen />);
    await act(async () => {});

    expect(queryAllByText('✨')).toHaveLength(0);
    expect(queryAllByText('💫')).toHaveLength(0);
    expect(queryAllByText('⭐️')).toHaveLength(0);
  });
});
