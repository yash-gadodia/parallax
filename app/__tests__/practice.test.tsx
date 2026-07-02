import { render, fireEvent, act } from '@testing-library/react-native';
import type { TestInstance } from 'test-renderer';
import PracticeScreen from '../practice';
import { supabase } from '../../src/lib/supabase';

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

jest.mock('../../src/features/profile/useIdentity', () => ({
  useIdentity: jest.fn(),
}));
jest.mock('../../src/features/pairing/useCouple', () => ({
  useCouple: jest.fn(),
}));
jest.mock('../../src/features/practice/usePracticeRound', () => ({
  ...jest.requireActual('../../src/features/practice/usePracticeRound'),
  usePracticeRound: jest.fn(),
}));
jest.mock('../../src/features/engagement/engagementActions', () => ({
  nudge: jest.fn(() => Promise.resolve()),
}));

import { useIdentity } from '../../src/features/profile/useIdentity';
import { useCouple } from '../../src/features/pairing/useCouple';
import { usePracticeRound } from '../../src/features/practice/usePracticeRound';
import { nudge } from '../../src/features/engagement/engagementActions';

const mockUseIdentity = useIdentity as jest.Mock;
const mockUseCouple = useCouple as jest.Mock;
const mockUsePracticeRound = usePracticeRound as jest.Mock;
const mockNudge = nudge as jest.Mock;

// Three revealed prompts with the partner's recorded picks.
const PROMPTS = [
  { id: 'p1', emoji: '🍜', q: 'comfort food after a bad day?', opts: ['ramen', 'pizza', 'ice cream'], partnerPick: 0 },
  { id: 'p2', emoji: '🛋️', q: 'ideal friday night?', opts: ['out out', 'couch fort'], partnerPick: 1 },
  { id: 'p3', emoji: '🎬', q: 'movie night pick?', opts: ['horror', 'rom-com', 'documentary'], partnerPick: 2 },
];

const ROUND = {
  prompts: PROMPTS,
  loading: false,
  error: false,
  notEnough: false,
  retry: jest.fn(),
};

const press = async (el: TestInstance) => {
  await act(async () => {
    fireEvent.press(el);
  });
};

describe('PracticeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIdentity.mockReturnValue({
      me: { name: 'Alex', initial: 'A' },
      partner: { name: 'Jordan', initial: 'J', hasPartner: true },
      loading: false,
    });
    mockUseCouple.mockReturnValue({
      couple: { id: 'c1', status: 'active', streak: 3 },
      status: 'active',
      loading: false,
    });
    mockUsePracticeRound.mockReturnValue(ROUND);
  });

  it('renders the first question from the revealed history, clearly labeled solo', async () => {
    const { getByText } = await render(<PracticeScreen />);

    expect(getByText('practice · nothing is sent')).toBeTruthy();
    expect(getByText('1/3')).toBeTruthy();
    expect(getByText('comfort food after a bad day?')).toBeTruthy();
    expect(getByText('ramen')).toBeTruthy();
    expect(getByText('pizza')).toBeTruthy();
    expect(getByText('ice cream')).toBeTruthy();
    expect(getByText('Your hunch — what did Jordan pick back then?')).toBeTruthy();
  });

  it('scores a correct hunch and a wrong one honestly, with a running tally', async () => {
    const { getByText, queryByText } = await render(<PracticeScreen />);

    // Q1: their recorded pick was ramen — I guess right.
    await press(getByText('ramen'));
    expect(getByText('✓ you read them right')).toBeTruthy();
    expect(getByText('you read Jordan 1/3')).toBeTruthy();

    await press(getByText('next question →'));
    expect(getByText('2/3')).toBeTruthy();
    expect(getByText('ideal friday night?')).toBeTruthy();

    // Q2: they went couch fort — I guess wrong.
    await press(getByText('out out'));
    expect(getByText('not this time — they went with "couch fort"')).toBeTruthy();
    expect(getByText('you read Jordan 1/3')).toBeTruthy();
    expect(queryByText('✓ you read them right')).toBeNull();

    await press(getByText('next question →'));

    // Q3: documentary is right again.
    await press(getByText('documentary'));
    expect(getByText('you read Jordan 2/3')).toBeTruthy();
    expect(getByText('see your score →')).toBeTruthy();
  });

  it('ends with the score, a nudge CTA (the real engagement action), and Done', async () => {
    const { getByText } = await render(<PracticeScreen />);

    await press(getByText('ramen'));
    await press(getByText('next question →'));
    await press(getByText('couch fort'));
    await press(getByText('next question →'));
    await press(getByText('documentary'));
    await press(getByText('see your score →'));

    expect(getByText('you read Jordan 3/3')).toBeTruthy();
    expect(getByText('practice · nothing is sent')).toBeTruthy();
    expect(getByText('flawless. the real reveal is waiting on them.')).toBeTruthy();

    await press(getByText('send Jordan a nudge 👋'));
    expect(mockNudge).toHaveBeenCalledWith('c1');

    await press(getByText('Done'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('locks the answered question: a second tap cannot change the hunch', async () => {
    const { getByText } = await render(<PracticeScreen />);

    await press(getByText('ramen'));
    expect(getByText('you read Jordan 1/3')).toBeTruthy();
    // Re-guessing after the reveal must not re-score.
    await press(getByText('pizza'));
    expect(getByText('you read Jordan 1/3')).toBeTruthy();
    expect(getByText('✓ you read them right')).toBeTruthy();
  });

  it('shows the warm empty state when there are fewer than 3 revealed prompts', async () => {
    mockUsePracticeRound.mockReturnValue({ ...ROUND, prompts: [], notEnough: true });

    const { getByText, queryByText } = await render(<PracticeScreen />);

    expect(getByText('not enough story yet')).toBeTruthy();
    expect(
      getByText(
        "practice pulls from your real reveals. unlock a few together and you'll have Jordan's answers to read."
      )
    ).toBeTruthy();
    expect(getByText('back to today')).toBeTruthy();
    expect(queryByText('practice · nothing is sent')).toBeNull();
  });

  it('shows loading, and an error state whose retry re-runs the round', async () => {
    mockUsePracticeRound.mockReturnValue({ ...ROUND, prompts: [], loading: true });
    const loadingView = await render(<PracticeScreen />);
    expect(loadingView.getByText('picking from your story…')).toBeTruthy();

    const retry = jest.fn();
    mockUsePracticeRound.mockReturnValue({ ...ROUND, prompts: [], error: true, retry });
    const errorView = await render(<PracticeScreen />);
    expect(errorView.getByText("couldn't load your reveals")).toBeTruthy();
    await press(errorView.getByText('try again'));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('never writes to the server: a full solo round issues no rpc and no table writes', async () => {
    const rpcSpy = jest.spyOn(supabase, 'rpc');
    const fromSpy = jest.spyOn(supabase, 'from');

    const { getByText } = await render(<PracticeScreen />);
    await press(getByText('ramen'));
    await press(getByText('next question →'));
    await press(getByText('out out'));
    await press(getByText('next question →'));
    await press(getByText('documentary'));
    await press(getByText('see your score →'));
    await press(getByText('Done'));

    expect(rpcSpy).not.toHaveBeenCalled();
    expect(fromSpy).not.toHaveBeenCalled();
  });
});
